import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { admins } from '../../../db/schema.ts';
import { AdminEntity, type AdminInsertModel } from './admin.entity.ts';

export type CreateAdmin = Omit<AdminInsertModel, 'id'>;

@Injectable()
export class AdminRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an admin by id, or throw if missing.
   * @param id admin id
   * @throws {NotFoundException} when no admin has this id
   */
  public async getByIdOrThrow(id: string): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.select().from(admins).where(eq(admins.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new AdminEntity(row);
  }

  /**
   * Get the admin an email belongs to.
   * @param email the email, lowercase
   */
  public async getByEmail(email: string): Promise<AdminEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(admins).where(eq(admins.email, email));

    return row === undefined ? null : new AdminEntity(row);
  }

  /**
   * Create an admin identity.
   * @param input the admin
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreateAdmin): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.insert(admins).values(input).returning();

    if (row === undefined) {
      throw new Error('The admin was not created');
    }

    return new AdminEntity(row);
  }
}
