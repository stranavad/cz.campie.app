import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisations } from '../../../db/schema.ts';
import { OrganisationEntity, type OrganisationInsertModel } from './organisation.entity.ts';

export type CreateOrganisation = Omit<OrganisationInsertModel, 'id'>;
export type UpdateOrganisation = Partial<Omit<OrganisationInsertModel, 'id' | 'subdomain'>>;

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
   * Get an Organisation by id, or throw if missing.
   * @param id Organisation id
   * @throws {NotFoundException} when no Organisation has this id
   */
  public async getByIdOrThrow(id: string): Promise<OrganisationEntity> {
    const organisation = await this.getById(id);

    if (organisation === null) {
      throw new NotFoundException();
    }

    return organisation;
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
  public async create(input: CreateOrganisation): Promise<OrganisationEntity> {
    const [row] = await this.unitOfWork.db.insert(organisations).values(input).returning();

    if (row === undefined) {
      throw new Error('The Organisation was not created');
    }

    return new OrganisationEntity(row);
  }

  /**
   * Update an Organisation.
   * @param id Organisation id
   * @param input the fields to change
   * @throws {NotFoundException} when no Organisation has this id
   */
  public async update(id: string, input: UpdateOrganisation): Promise<OrganisationEntity> {
    const [row] = await this.unitOfWork.db.update(organisations).set(input).where(eq(organisations.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new OrganisationEntity(row);
  }
}
