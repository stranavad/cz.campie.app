import { Injectable } from '@nestjs/common';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisations } from '../../../db/schema.ts';
import { OrganisationEntity } from './organisation.entity.ts';

@Injectable()
export class OrganisationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Create an Organisation.
   * @throws {Error} when the database returns no row
   */
  public async create(): Promise<OrganisationEntity> {
    const [row] = await this.unitOfWork.db.insert(organisations).values({}).returning();

    if (row === undefined) {
      throw new Error('The Organisation was not created');
    }

    return new OrganisationEntity(row);
  }
}
