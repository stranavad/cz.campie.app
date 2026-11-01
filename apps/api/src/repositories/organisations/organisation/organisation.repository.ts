import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisations } from '../../../db/schema.ts';
import { OrganisationEntity } from './organisation.entity.ts';

@Injectable()
export class OrganisationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an Organisation by id.
   * @param id Organisation id
   */
  public async getById(id: string): Promise<OrganisationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(organisations).where(eq(organisations.id, id));

    return row === undefined ? null : new OrganisationEntity(row);
  }

  /**
   * Get an Organisation by its subdomain.
   * @param subdomain the subdomain, lowercase
   */
  public async getBySubdomain(subdomain: string): Promise<OrganisationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(organisations).where(eq(organisations.subdomain, subdomain));

    return row === undefined ? null : new OrganisationEntity(row);
  }

  /**
   * Create an Organisation.
   * @param input the Organisation
   * @throws {Error} when the database returns no row
   */
  public async create(input: { subdomain: string }): Promise<OrganisationEntity> {
    const [row] = await this.unitOfWork.db.insert(organisations).values(input).returning();

    if (row === undefined) {
      throw new Error('The Organisation was not created');
    }

    return new OrganisationEntity(row);
  }
}
