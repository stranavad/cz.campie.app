import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { emailVerifications } from '../../../db/schema.ts';
import { EmailVerificationEntity, type EmailVerificationInsertModel } from './email-verification.entity.ts';

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an email verification by the hash of its token.
   * @param tokenHash SHA-256 of the token from the link
   */
  public async getByTokenHash(tokenHash: Buffer): Promise<EmailVerificationEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.tokenHash, tokenHash));

    return row === undefined ? null : new EmailVerificationEntity(row);
  }

  /**
   * Store an admin's email verification for the current Organisation in place of their earlier one, so
   * only the newest link works.
   * @param input the admin, the hash of the link's token and its expiry
   * @throws {Error} when the database returns no row
   */
  public async replace(
    input: Omit<EmailVerificationInsertModel, 'id' | 'organisationId'>,
  ): Promise<EmailVerificationEntity> {
    const values = { ...input, organisationId: this.unitOfWork.organisationId };
    const [row] = await this.unitOfWork.db
      .insert(emailVerifications)
      .values(values)
      .onConflictDoUpdate({
        target: emailVerifications.adminId,
        set: { organisationId: values.organisationId, tokenHash: input.tokenHash, expiresAt: input.expiresAt },
      })
      .returning();

    if (row === undefined) {
      throw new Error(`The email verification of admin ${input.adminId} was not stored`);
    }

    return new EmailVerificationEntity(row);
  }

  /**
   * Use up an email verification by removing it, telling whether this call removed it. Of two simultaneous
   * calls only one does, so a link works once.
   * @param id email verification id
   */
  public async consume(id: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .delete(emailVerifications)
      .where(eq(emailVerifications.id, id))
      .returning({ id: emailVerifications.id });

    return rows.length > 0;
  }
}
