import { Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { totpCredentials, totpRecoveryCodes } from '../../../db/schema.ts';
import { TotpCredentialEntity } from './totp-credential.entity.ts';

@Injectable()
export class TotpCredentialRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an admin's TOTP credential, confirmed or not.
   * @param adminId admin id
   */
  public async getByAdmin(adminId: string): Promise<TotpCredentialEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(totpCredentials).where(eq(totpCredentials.adminId, adminId));

    return row === undefined ? null : new TotpCredentialEntity(row);
  }

  /**
   * Store a new unconfirmed secret for an admin, replacing an unconfirmed one; a confirmed one stays.
   * @param adminId admin id
   * @param sealedSecret the secret, sealed
   * @returns the new credential, or null when the admin's TOTP is already on
   */
  public async replaceUnconfirmed(adminId: string, sealedSecret: Buffer): Promise<TotpCredentialEntity | null> {
    const [row] = await this.unitOfWork.db
      .insert(totpCredentials)
      .values({ adminId, secret: sealedSecret })
      .onConflictDoUpdate({
        target: totpCredentials.adminId,
        set: { secret: sealedSecret, lastUsedStep: null },
        setWhere: isNull(totpCredentials.confirmedAt),
      })
      .returning();

    return row === undefined ? null : new TotpCredentialEntity(row);
  }

  /**
   * Confirm an admin's unconfirmed credential with the time step of the code that proved it, only while it
   * still holds the secret the code was checked against: a setup started again meanwhile replaced it.
   * @param adminId admin id
   * @param sealedSecret the secret as stored when the code was checked
   * @param step the code's time step, which no later code may repeat
   * @param confirmedAt now
   * @returns whether an unconfirmed credential was confirmed; false when another request did it first
   */
  public async confirm(adminId: string, sealedSecret: Buffer, step: number, confirmedAt: Date): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(totpCredentials)
      .set({ confirmedAt, lastUsedStep: step })
      .where(
        and(
          eq(totpCredentials.adminId, adminId),
          eq(totpCredentials.secret, sealedSecret),
          isNull(totpCredentials.confirmedAt),
        ),
      )
      .returning();

    return rows.length > 0;
  }

  /**
   * Use up the time step of a code of an admin's confirmed credential, unless it or a later one was used.
   * @param adminId admin id
   * @param step the code's time step
   * @returns whether the step was still unused, so a code entered twice works only once
   */
  public async useStep(adminId: string, step: number): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(totpCredentials)
      .set({ lastUsedStep: step })
      .where(
        and(
          eq(totpCredentials.adminId, adminId),
          isNotNull(totpCredentials.confirmedAt),
          or(isNull(totpCredentials.lastUsedStep), lt(totpCredentials.lastUsedStep, step)),
        ),
      )
      .returning();

    return rows.length > 0;
  }

  /**
   * Replace an admin's recovery codes.
   * @param adminId the admin
   * @param codeHashes the new codes' SHA-256, hex
   */
  public async replaceRecoveryCodes(adminId: string, codeHashes: readonly string[]): Promise<void> {
    await this.unitOfWork.db.delete(totpRecoveryCodes).where(eq(totpRecoveryCodes.adminId, adminId));
    await this.unitOfWork.db.insert(totpRecoveryCodes).values(codeHashes.map((codeHash) => ({ adminId, codeHash })));
  }

  /**
   * Use one of an admin's recovery codes, if it is theirs and unused.
   * @param adminId the admin
   * @param codeHash the code's SHA-256, hex
   * @param at when
   * @returns whether a code was used
   */
  public async useRecoveryCode(adminId: string, codeHash: string, at: Date): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(totpRecoveryCodes)
      .set({ usedAt: at })
      .where(
        and(
          eq(totpRecoveryCodes.adminId, adminId),
          eq(totpRecoveryCodes.codeHash, codeHash),
          isNull(totpRecoveryCodes.usedAt),
        ),
      )
      .returning({ id: totpRecoveryCodes.id });

    return rows.length > 0;
  }

  /**
   * Turn an admin's two-step login off: their secret and recovery codes go.
   * @param adminId the admin
   * @returns whether they had it
   */
  public async remove(adminId: string): Promise<boolean> {
    await this.unitOfWork.db.delete(totpRecoveryCodes).where(eq(totpRecoveryCodes.adminId, adminId));
    const rows = await this.unitOfWork.db
      .delete(totpCredentials)
      .where(eq(totpCredentials.adminId, adminId))
      .returning({ adminId: totpCredentials.adminId });

    return rows.length > 0;
  }

  /**
   * Tell whether an admin's two-step login is on.
   * @param adminId the admin
   */
  public async isEnabled(adminId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db
      .select({ adminId: totpCredentials.adminId })
      .from(totpCredentials)
      .where(and(eq(totpCredentials.adminId, adminId), isNotNull(totpCredentials.confirmedAt)));

    return row !== undefined;
  }
}
