import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { camps, campSlugs } from '../../../db/schema.ts';
import { CampEntity, type CampInsertModel } from './camp.entity.ts';

export type CreateCamp = Omit<CampInsertModel, 'id' | 'organisationId'>;
export type UpdateCamp = Partial<Omit<CampInsertModel, 'id' | 'organisationId'>>;

@Injectable()
export class CampRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List the current Organisation's Camps by name.
   */
  public async list(): Promise<CampEntity[]> {
    const rows = await this.unitOfWork.db.select().from(camps).orderBy(asc(camps.name), asc(camps.id));

    return rows.map((row) => new CampEntity(row));
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
   * Get the Camp of the current Organisation that has or had a slug.
   * @param slug the slug, lowercase
   */
  public async getBySlug(slug: string): Promise<CampEntity | null> {
    const [row] = await this.unitOfWork.db
      .select({ camp: camps })
      .from(campSlugs)
      .innerJoin(camps, and(eq(camps.organisationId, campSlugs.organisationId), eq(camps.id, campSlugs.campId)))
      .where(eq(campSlugs.slug, slug));

    return row === undefined ? null : new CampEntity(row.camp);
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
   * Tell whether a file is the photo of a Camp of the current Organisation.
   * @param fileId the file's id
   */
  public async hasPhoto(fileId: string): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .select({ id: camps.id })
      .from(camps)
      .where(eq(camps.photoFileId, fileId))
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

  /**
   * Keep a slug for a Camp of the current Organisation, unless another of its Camps has or had it. A
   * simultaneous claim of the same slug waits for this one to commit or roll back.
   * @param campId Camp id
   * @param slug the slug, lowercase
   * @returns whether the slug is the Camp's now
   */
  public async claimSlug(campId: string, slug: string): Promise<boolean> {
    await this.unitOfWork.db
      .insert(campSlugs)
      .values({ organisationId: this.unitOfWork.organisationId, slug, campId })
      .onConflictDoNothing();

    const [owner] = await this.unitOfWork.db
      .select({ campId: campSlugs.campId })
      .from(campSlugs)
      .where(eq(campSlugs.slug, slug));

    return owner?.campId === campId;
  }
}
