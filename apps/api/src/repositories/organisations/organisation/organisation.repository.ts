import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import type { OrganisationStatus } from '@repo/schema/organisations';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisations } from '../../../db/schema.ts';
import { OrganisationEntity, type OrganisationInsertModel } from './organisation.entity.ts';

export type CreateOrganisation = Omit<OrganisationInsertModel, 'id'>;
// An Organisation as its creator gives it; when it signed up is the Clock's.
export type NewOrganisation = Omit<CreateOrganisation, 'createdAt'>;
export type UpdateOrganisation = Partial<Omit<OrganisationInsertModel, 'id' | 'subdomain'>>;
// What the operator console changes, and only while the Organisation has a given status.
export type ConsoleChange = Partial<Pick<OrganisationInsertModel, 'status' | 'subdomain'>>;

@Injectable()
export class OrganisationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List every Organisation, the newest first: ids are UUIDv7, so they sort by creation.
   */
  public async list(): Promise<OrganisationEntity[]> {
    const rows = await this.unitOfWork.db.select().from(organisations).orderBy(desc(organisations.id));

    return rows.map((row) => new OrganisationEntity(row));
  }

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
   * Get an Organisation by id and lock its row until the unit of work ends, so what is read stays what a
   * change in the same unit of work starts from.
   * @param id Organisation id
   */
  public async getByIdForUpdate(id: string): Promise<OrganisationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(organisations).where(eq(organisations.id, id)).for('update');

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

  /**
   * Change an Organisation's status or subdomain only while it has the given status, in one statement, so
   * two simultaneous changes cannot both start from it.
   * @param id Organisation id
   * @param status the status it must have
   * @param change the new status or subdomain
   * @returns the changed Organisation, or null when none with this id has the status
   */
  public async updateWhileStatus(
    id: string,
    status: OrganisationStatus,
    change: ConsoleChange,
  ): Promise<OrganisationEntity | null> {
    const [row] = await this.unitOfWork.db
      .update(organisations)
      .set(change)
      .where(and(eq(organisations.id, id), eq(organisations.status, status)))
      .returning();

    return row === undefined ? null : new OrganisationEntity(row);
  }

  /**
   * Delete an Organisation with everything it holds, only while it has the given status.
   * @param id Organisation id
   * @param status the status it must have
   * @returns the deleted Organisation, or null when none with this id has the status
   */
  public async removeWhileStatus(id: string, status: OrganisationStatus): Promise<OrganisationEntity | null> {
    const [row] = await this.unitOfWork.db
      .delete(organisations)
      .where(and(eq(organisations.id, id), eq(organisations.status, status)))
      .returning();

    return row === undefined ? null : new OrganisationEntity(row);
  }
}
