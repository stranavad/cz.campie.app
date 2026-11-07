import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { camps } from '../../../db/schema.ts';
import { CampEntity, type CampInsertModel } from './camp.entity.ts';

export type CreateCamp = Omit<CampInsertModel, 'id' | 'organisationId'>;
export type UpdateCamp = Partial<Omit<CampInsertModel, 'id' | 'organisationId'>>;

@Injectable()
export class CampRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a Camp of the current Organisation by id, locked until the unit of work ends, or throw if missing.
   * @param id Camp id
   * @throws {NotFoundException} when no Camp has this id in the current Organisation
   */
  public async getByIdForUpdateOrThrow(id: string): Promise<CampEntity> {
    const [row] = await this.unitOfWork.db.select().from(camps).where(eq(camps.id, id)).for('update');

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new CampEntity(row);
  }

  /**
   * Get a Camp of the current Organisation by id, or throw if missing.
   * @param id Camp id
   * @throws {NotFoundException} when no Camp has this id in the current Organisation
   */
  public async getByIdOrThrow(id: string): Promise<CampEntity> {
    const [row] = await this.unitOfWork.db.select().from(camps).where(eq(camps.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new CampEntity(row);
  }

  /**
   * Tell whether a file is the logo of a Camp of the current Organisation.
   * @param fileId the file's id
   */
  public async hasLogo(fileId: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .select({ id: camps.id })
      .from(camps)
      .where(eq(camps.logoFileId, fileId))
      .limit(1);

    return rows.length > 0;
  }

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

  /**
   * Update a Camp of the current Organisation.
   * @param id Camp id
   * @param input the fields to change
   * @throws {NotFoundException} when no Camp has this id in the current Organisation
   */
  public async update(id: string, input: UpdateCamp): Promise<CampEntity> {
    const [row] = await this.unitOfWork.db.update(camps).set(input).where(eq(camps.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new CampEntity(row);
  }
}
