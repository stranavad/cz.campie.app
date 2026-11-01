import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisationKeys } from '../../../db/schema.ts';
import { OrganisationKeyEntity } from './organisation-key.entity.ts';

@Injectable()
export class OrganisationKeyRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get the current Organisation's wrapped data key, or null once it is destroyed.
   */
  public async getCurrent(): Promise<OrganisationKeyEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(organisationKeys)
      .where(eq(organisationKeys.organisationId, this.unitOfWork.organisationId));

    return row === undefined ? null : new OrganisationKeyEntity(row);
  }

  /**
   * Store a new Organisation's wrapped data key.
   * @param organisationId the new Organisation
   * @param wrappedKey the data key, wrapped by the master key
   * @throws {Error} when the database returns no row
   */
  public async create(organisationId: string, wrappedKey: Buffer): Promise<OrganisationKeyEntity> {
    const [row] = await this.unitOfWork.db.insert(organisationKeys).values({ organisationId, wrappedKey }).returning();

    if (row === undefined) {
      throw new Error('The data key was not stored');
    }

    return new OrganisationKeyEntity(row);
  }
}
