import { Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { totpCredentials } from '../../../db/schema.ts';
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
   * Confirm an admin's unconfirmed credential with the time step of the code that proved it.
   * @param adminId admin id
   * @param step the code's time step, which no later code may repeat
   * @param confirmedAt now
   * @returns whether an unconfirmed credential was confirmed; false when another request did it first
   */
  public async confirm(adminId: string, step: number, confirmedAt: Date): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(totpCredentials)
      .set({ confirmedAt, lastUsedStep: step })
      .where(and(eq(totpCredentials.adminId, adminId), isNull(totpCredentials.confirmedAt)))
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
}
