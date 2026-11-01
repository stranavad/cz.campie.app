import { Injectable } from '@nestjs/common';
import { eq, type InferInsertModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { adminSessions } from '../../../db/schema.ts';
import { AdminSessionEntity } from './admin-session.entity.ts';

@Injectable()
export class AdminSessionRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an admin session by the hash of its token.
   * @param tokenHash SHA-256 of the session token
   */
  public async getByTokenHash(tokenHash: Buffer): Promise<AdminSessionEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));

    return row === undefined ? null : new AdminSessionEntity(row);
  }

  /**
   * Create an admin session.
   * @param input the session
   * @throws {Error} when the database returns no row
   */
  public async create(input: Omit<InferInsertModel<typeof adminSessions>, 'id'>): Promise<AdminSessionEntity> {
    const [row] = await this.unitOfWork.db.insert(adminSessions).values(input).returning();

    if (row === undefined) {
      throw new Error('The admin session was not created');
    }

    return new AdminSessionEntity(row);
  }
}
