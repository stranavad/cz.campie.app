import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { turnusy } from '../../../db/schema.ts';
import { TurnusEntity, type TurnusInsertModel } from './turnus.entity.ts';

export type TurnusFields = Omit<TurnusInsertModel, 'id' | 'organisationId' | 'campId'>;

@Injectable()
export class TurnusRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Camp's Turnusy by start date.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<TurnusEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(turnusy)
      .where(eq(turnusy.campId, campId))
      .orderBy(asc(turnusy.startDate), asc(turnusy.id));

    return rows.map((row) => new TurnusEntity(row));
  }

  /**
   * Get a Turnus of the current Organisation by id.
   * @param id Turnus id
   */
  public async getById(id: string): Promise<TurnusEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(turnusy).where(eq(turnusy.id, id));

    return row === undefined ? null : new TurnusEntity(row);
  }

  /**
   * Get a Turnus of the current Organisation by id, or throw if missing.
   * @param id Turnus id
   * @throws {NotFoundException} when no Turnus has this id in the current Organisation
   */
  public async getByIdOrThrow(id: string): Promise<TurnusEntity> {
    const [row] = await this.unitOfWork.db.select().from(turnusy).where(eq(turnusy.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new TurnusEntity(row);
  }

  /**
   * Create a Turnus of a Camp of the current Organisation.
   * @param campId Camp id
   * @param input the Turnus
   * @throws {Error} when the database returns no row
   */
  public async create(campId: string, input: TurnusFields): Promise<TurnusEntity> {
    const [row] = await this.unitOfWork.db
      .insert(turnusy)
      .values({ ...input, campId, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Turnus was not created');
    }

    return new TurnusEntity(row);
  }

  /**
   * Update a Turnus of the current Organisation.
   * @param id Turnus id
   * @param input the fields to change
   * @throws {NotFoundException} when no Turnus has this id in the current Organisation
   */
  public async update(id: string, input: TurnusFields): Promise<TurnusEntity> {
    const [row] = await this.unitOfWork.db.update(turnusy).set(input).where(eq(turnusy.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new TurnusEntity(row);
  }

  /**
   * Remove a Turnus of the current Organisation.
   * @param id Turnus id
   * @throws {NotFoundException} when no Turnus has this id in the current Organisation
   */
  public async remove(id: string): Promise<TurnusEntity> {
    const [row] = await this.unitOfWork.db.delete(turnusy).where(eq(turnusy.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new TurnusEntity(row);
  }
}
