import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { asc, eq, inArray } from 'drizzle-orm';

import { PERMISSION_AREAS, type Account, type ChangePasswordBody } from '@repo/schema/admins';
import { passwordProblem, type FullName } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { hashPassword } from '../../../../core/passwords/password-hash.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { memberships, organisations } from '../../../../db/schema.ts';
import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { permissionsOf } from '../../../../repositories/admins/membership/membership.entity.ts';
import { OperatorRepository } from '../../../../repositories/operators/operator/operator.repository.ts';
import { SupportGrantRepository } from '../../../../repositories/organisations/support-grant/support-grant.repository.ts';
import { AdminService } from '../../admin/services/admin.service.ts';
import { LoginService } from '../../login/services/login.service.ts';
import { TotpService } from '../../totp/services/totp.service.ts';
import { accountChangedJob } from '../account-changed.job.ts';

@Injectable()
export class AccountService {
  private readonly productName: string;

  constructor(
    private readonly admins: AdminService,
    private readonly totp: TotpService,
    private readonly operators: OperatorRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly supportGrants: SupportGrantRepository,
    private readonly audit: AuditService,
    private readonly logins: LoginService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.productName = config.get('PRODUCT_NAME', { infer: true });
  }

  /**
   * Get an admin's own account: their email, whether they are the Platform operator, their TOTP and this
   * session's, and the Organisations they are a member of, with each one's status and their permissions. Reads platform tables
   * only, so it runs in a platform unit of work.
   * @param adminId the signed-in admin
   * @param session their session
   */
  public async get(adminId: string, session: { readonly secondFactor: boolean }): Promise<Account> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    const rows = await this.unitOfWork.db
      .select({
        membership: memberships,
        organisation: {
          id: organisations.id,
          displayName: organisations.displayName,
          subdomain: organisations.subdomain,
          status: organisations.status,
          totpRequired: organisations.totpRequired,
          accentColour: organisations.accentColour,
        },
      })
      .from(memberships)
      .innerJoin(organisations, eq(organisations.id, memberships.organisationId))
      .where(eq(memberships.adminId, adminId))
      .orderBy(asc(memberships.id));

    const operator = await this.operators.isOperator(adminId);
    const totp = await this.totp.summary(adminId);

    return {
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      emailVerified: admin.emailVerifiedAt !== null,
      operator,
      totp: totp === null ? null : { ...totp, enabledAt: totp.enabledAt.toISOString() },
      secondFactor: session.secondFactor,
      memberships: [
        ...rows.map(({ membership, organisation }) => ({
          owner: membership.owner,
          permissions: permissionsOf(membership),
          organisation,
          support: null,
        })),
        // The access guard lets the operator in only with a TOTP code, so the account offers them only then.
        ...(operator && session.secondFactor ? await this.supported() : []),
      ],
    };
  }

  /**
   * Set the signed-in admin's own first and last name, audited in the platform's log: the identity belongs
   * to no one Organisation. With two-step login on, only from a session that passed it.
   * @param actor the signed-in admin
   * @param session their session
   * @param name the new name
   */
  public async rename(actor: Actor, session: { readonly secondFactor: boolean }, name: FullName): Promise<void> {
    const adminId = adminOf(actor).identity;

    await this.totp.requirePassed(adminId, session);

    const { before, after } = await this.admins.rename(adminId, name);

    await this.audit.recordForPlatform(actor, {
      action: 'admin.rename',
      target: { type: 'admin', id: adminId },
      change: { before: nameOf(before), after: nameOf(after) },
    });
  }

  /**
   * Change the signed-in admin's password with their current one, which counts against the login limits
   * when wrong. Every other session of theirs ends, the admin is emailed, and the platform's log records
   * the fact. With two-step login on, only from a session that passed it.
   * @param actor the signed-in admin
   * @param session their session
   * @param body the current and the new password
   * @throws {BadRequestException} when the new password is too weak
   */
  public async changePassword(
    actor: Actor,
    session: { readonly id: string; readonly secondFactor: boolean },
    { currentPassword, password }: ChangePasswordBody,
  ): Promise<void> {
    const { identity, ipAddress } = adminOf(actor);

    await this.totp.requirePassed(identity, session);

    const admin = await this.admins.getByIdOrThrow(identity);

    await this.logins.confirmPassword(admin.email, currentPassword, ipAddress);

    const problem = passwordProblem(password, { email: admin.email, productName: this.productName });

    if (problem !== null) {
      throw new BadRequestException({ code: problem, message: `Password change refused: ${problem}` });
    }

    await this.admins.changePassword(admin.id, session.id, await hashPassword(password));
    await this.audit.recordForPlatform(actor, {
      action: 'admin.change_password',
      target: { type: 'admin', id: admin.id },
    });
    this.jobs.enqueue(accountChangedJob, { adminId: admin.id, change: 'password' });
  }

  /**
   * List the Organisations with a support grant in force, as the operator enters them.
   */
  private async supported(): Promise<Account['memberships']> {
    const grants = await this.supportGrants.listActive(this.clock.now());
    const organisationsById = new Map(
      (grants.length === 0
        ? []
        : await this.unitOfWork.db
            .select({
              id: organisations.id,
              displayName: organisations.displayName,
              subdomain: organisations.subdomain,
              status: organisations.status,
              totpRequired: organisations.totpRequired,
              accentColour: organisations.accentColour,
            })
            .from(organisations)
            .where(
              inArray(
                organisations.id,
                grants.map(({ organisationId }) => organisationId),
              ),
            )
      ).map((organisation) => [organisation.id, organisation]),
    );

    return grants.flatMap((grant) => {
      const organisation = organisationsById.get(grant.organisationId);
      const level = grant.allowWrites ? 'write' : 'read';

      return organisation === undefined
        ? []
        : [
            {
              owner: false,
              permissions: Object.fromEntries(
                PERMISSION_AREAS.map((area) => [area, level]),
              ) as Account['memberships'][number]['permissions'],
              organisation,
              support: { allowWrites: grant.allowWrites, expiresAt: grant.expiresAt.toISOString() },
            },
          ];
    });
  }
}

/**
 * Take the admin acting on their own account from the actor of an account request.
 * @param actor the actor
 * @throws {Error} for an actor other than an admin
 */
export function adminOf(actor: Actor): Extract<Actor, { identity: string }> {
  if (actor.kind !== 'admin') {
    throw new Error('Only an admin changes their own account');
  }

  return actor;
}

/**
 * Take an admin's name alone, as the audit log records a rename.
 * @param admin the admin
 */
function nameOf({ firstName, lastName }: AdminEntity): Pick<AdminEntity, 'firstName' | 'lastName'> {
  return { firstName, lastName };
}
