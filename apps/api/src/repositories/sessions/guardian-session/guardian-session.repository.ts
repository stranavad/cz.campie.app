import { Injectable } from '@nestjs/common';
import { eq, lt, type InferInsertModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { guardianSessions } from '../../../db/schema.ts';
import { GuardianSessionEntity } from './guardian-session.entity.ts';

@Injectable()
export class GuardianSessionRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a guardian session of the current Organisation by the hash of its token.
   * @param tokenHash SHA-256 of the session token
   */
  public async getByTokenHash(tokenHash: Buffer): Promise<GuardianSessionEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(guardianSessions)
      .where(eq(guardianSessions.tokenHash, tokenHash));

    return row === undefined ? null : new GuardianSessionEntity(row);
  }

  /**
   * Create a guardian session in the current Organisation.
   * @param input the session, without its Organisation
   * @throws {Error} when the database returns no row
   */
  public async create(
    input: Omit<InferInsertModel<typeof guardianSessions>, 'id' | 'organisationId'>,
  ): Promise<GuardianSessionEntity> {
    const [row] = await this.unitOfWork.db
      .insert(guardianSessions)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The guardian session was not created');
    }

    return new GuardianSessionEntity(row);
  }

  /**
   * Remove the guardian session of the current Organisation a token's hash opens, if any.
   * @param tokenHash SHA-256 of the session token
   */
  public async removeByTokenHash(tokenHash: Buffer): Promise<void> {
    await this.unitOfWork.db.delete(guardianSessions).where(eq(guardianSessions.tokenHash, tokenHash));
  }

  /**
   * Remove the current Organisation's guardian sessions that expired before an instant.
   * @param before the instant
   * @returns how many were removed
   */
  public async removeExpired(before: Date): Promise<number> {
    const removed = await this.unitOfWork.db
      .delete(guardianSessions)
      .where(lt(guardianSessions.expiresAt, before))
      .returning({ id: guardianSessions.id });

    return removed.length;
  }
}
