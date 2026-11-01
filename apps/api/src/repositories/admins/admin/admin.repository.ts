import { Injectable } from '@nestjs/common';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { admins } from '../../../db/schema.ts';
import { AdminEntity } from './admin.entity.ts';

@Injectable()
export class AdminRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Create an admin identity.
   * @param input the admin
   * @throws {Error} when the database returns no row
   */
  public async create(input: { email: string }): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.insert(admins).values(input).returning();

    if (row === undefined) {
      throw new Error('The admin was not created');
    }

    return new AdminEntity(row);
  }
}
