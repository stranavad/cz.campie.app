import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { passwordResets } from '../../../db/schema.ts';
import { PasswordResetEntity, type PasswordResetInsertModel } from './password-reset.entity.ts';

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a password reset by the hash of its token.
   * @param tokenHash SHA-256 of the token from the link
   */
  public async getByTokenHash(tokenHash: Buffer): Promise<PasswordResetEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(passwordResets).where(eq(passwordResets.tokenHash, tokenHash));

    return row === undefined ? null : new PasswordResetEntity(row);
  }

  /**
   * Create a password reset.
   * @param input the reset
   * @throws {Error} when the database returns no row
   */
  public async create(input: Omit<PasswordResetInsertModel, 'id'>): Promise<PasswordResetEntity> {
    const [row] = await this.unitOfWork.db.insert(passwordResets).values(input).returning();

    if (row === undefined) {
      throw new Error('The password reset was not created');
    }

    return new PasswordResetEntity(row);
  }

  /**
   * Use up a password reset by removing it, telling whether this call removed it. Of two simultaneous
   * calls only one does, so a link works once.
   * @param id password reset id
   */
  public async consume(id: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .delete(passwordResets)
      .where(eq(passwordResets.id, id))
      .returning({ id: passwordResets.id });

    return rows.length > 0;
  }

  /**
   * Remove every password reset of an admin.
   * @param adminId admin id
   */
  public async removeByAdmin(adminId: string): Promise<void> {
    await this.unitOfWork.db.delete(passwordResets).where(eq(passwordResets.adminId, adminId));
  }
}
