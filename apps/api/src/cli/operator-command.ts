import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { emailSchema, fullNameSchema, type FullName } from '@repo/schema/shared';

import type { PlatformAuditAction } from '../core/audit/platform-actions.ts';
import { admins, adminSessions, operators, platformAuditEntries, totpCredentials } from '../db/schema.ts';

export const OPERATOR_USAGE = `Usage: operator <command> <email>

  grant <email> [<first name> <last name>]
                      make the admin the Platform operator, creating the account with the name given and
                      without a password if there is none; the operator sets one through the forgotten
                      password page
  revoke <email>      take the Platform operator's flag away
  reset-totp <email>  remove the admin's TOTP, so they set it up again, and end their sessions`;

// A command the operator mistyped or that does not apply; its message is for the person at the terminal.
export class OperatorCommandError extends Error {
  public override name = 'OperatorCommandError';
}

type Database = ReturnType<typeof drizzle>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Run one operator command against the database, as the role that owns the tables: the only role that may
 * write the operator flag.
 * @param ownerUrl the database URL of the tables' owner
 * @param args the command and its email
 * @throws {OperatorCommandError} on a mistyped command or one that does not apply
 * @returns what happened, for the terminal
 */
export async function runOperatorCommand(ownerUrl: string, args: readonly string[]): Promise<string> {
  const [command, rawEmail, ...rest] = args;
  const email = emailSchema.safeParse(rawEmail);
  // Only grant takes a name: a first and a last name, both or neither.
  const name =
    command === 'grant' && rest.length === 2
      ? fullNameSchema.safeParse({ firstName: rest[0], lastName: rest[1] })
      : undefined;

  if (!email.success || (rest.length > 0 && name?.success !== true)) {
    throw new OperatorCommandError(OPERATOR_USAGE);
  }

  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();

  try {
    const db = drizzle({ client });

    switch (command) {
      case 'grant':
        return await db.transaction((tx) => grant(tx, email.data, name?.data));
      case 'revoke':
        return await db.transaction((tx) => revoke(tx, email.data));
      case 'reset-totp':
        return await db.transaction((tx) => resetTotp(tx, email.data));
      default:
        throw new OperatorCommandError(OPERATOR_USAGE);
    }
  } finally {
    await client.end();
  }
}

/**
 * Make an admin the Platform operator, creating the account if there is none; an existing account keeps its
 * own name.
 * @param tx the transaction
 * @param email the admin's email, normalised
 * @param name the name of an account created now
 */
async function grant(tx: Transaction, email: string, name: FullName | undefined): Promise<string> {
  const [created] = await tx
    .insert(admins)
    .values({ email, ...name })
    .onConflictDoNothing()
    .returning({ id: admins.id });
  const adminId = created?.id ?? (await adminIdOrThrow(tx, email));
  const [granted] = await tx.insert(operators).values({ adminId }).onConflictDoNothing().returning();

  if (granted === undefined) {
    return `${email} already is the Platform operator.`;
  }

  await record(tx, 'operator.grant', adminId);

  return created === undefined
    ? `${email} is now the Platform operator.`
    : `${email} is now the Platform operator, with a new account without a password: set one through the forgotten password page, then set up TOTP at the first login.`;
}

/**
 * Take the operator flag from an admin.
 * @param tx the transaction
 * @param email the admin's email, normalised
 * @throws {OperatorCommandError} when the admin is not the Platform operator
 */
async function revoke(tx: Transaction, email: string): Promise<string> {
  const adminId = await adminIdOrThrow(tx, email);
  const [revoked] = await tx.delete(operators).where(eq(operators.adminId, adminId)).returning();

  if (revoked === undefined) {
    throw new OperatorCommandError(`${email} is not the Platform operator.`);
  }

  await record(tx, 'operator.revoke', adminId);

  return `${email} is no longer the Platform operator.`;
}

/**
 * Remove an admin's TOTP and end their sessions, so their next login sets it up again.
 * @param tx the transaction
 * @param email the admin's email, normalised
 */
async function resetTotp(tx: Transaction, email: string): Promise<string> {
  const adminId = await adminIdOrThrow(tx, email);

  await tx.delete(totpCredentials).where(eq(totpCredentials.adminId, adminId));
  await tx.delete(adminSessions).where(eq(adminSessions.adminId, adminId));
  await record(tx, 'totp.reset', adminId);

  return `${email} has no TOTP and no session now; it is set up again at the next login.`;
}

/**
 * Find the id of the admin with an email.
 * @param tx the transaction
 * @param email the admin's email, normalised
 * @throws {OperatorCommandError} when no admin has it
 */
async function adminIdOrThrow(tx: Transaction, email: string): Promise<string> {
  const [admin] = await tx.select({ id: admins.id }).from(admins).where(eq(admins.email, email));

  if (admin === undefined) {
    throw new OperatorCommandError(`No admin has the email ${email}.`);
  }

  return admin.id;
}

/**
 * Record a command in the platform audit log, as the system: the person at the terminal holds the
 * database owner's credentials, which name no one.
 * @param tx the transaction
 * @param action what happened
 * @param adminId the admin it happened to
 */
async function record(tx: Transaction, action: PlatformAuditAction, adminId: string): Promise<void> {
  await tx.insert(platformAuditEntries).values({
    occurredAt: sql`now()`,
    actorKind: 'system',
    action,
    targetType: 'admin',
    targetId: adminId,
  });
}
