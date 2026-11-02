import { Injectable } from '@nestjs/common';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { camps } from '../../../db/schema.ts';
import { CampEntity, type CampInsertModel } from './camp.entity.ts';

export type CreateCamp = Omit<CampInsertModel, 'id' | 'organisationId'>;

@Injectable()
export class CampRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Create a Camp in the current Organisation.
   * @param input the Camp
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreateCamp): Promise<CampEntity> {
    const [row] = await this.unitOfWork.db
      .insert(camps)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Camp was not created');
    }

    return new CampEntity(row);
  }
}
