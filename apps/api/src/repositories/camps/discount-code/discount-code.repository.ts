import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { discountCodes, discountCodeUses } from '../../../db/schema.ts';
import { DiscountCodeEntity, type DiscountCodeInsertModel } from './discount-code.entity.ts';

export type CreateDiscountCode = Omit<DiscountCodeInsertModel, 'id' | 'organisationId' | 'campId' | 'active'>;
export type UpdateDiscountCode = Partial<Pick<DiscountCodeInsertModel, 'active' | 'usageLimit' | 'expiresOn'>>;

@Injectable()
export class DiscountCodeRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Camp's Discount codes by code.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<DiscountCodeEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.campId, campId))
      .orderBy(asc(sql`lower(${discountCodes.code})`));

    return rows.map((row) => new DiscountCodeEntity(row));
  }

  /**
   * Get a Discount code of the current Organisation by id, or throw if missing.
   * @param id Discount code id
   * @throws {NotFoundException} when no Discount code has this id in the current Organisation
   */
  public async getByIdOrThrow(id: string): Promise<DiscountCodeEntity> {
    const [row] = await this.unitOfWork.db.select().from(discountCodes).where(eq(discountCodes.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new DiscountCodeEntity(row);
  }

  /**
   * Get a Camp's Discount code by its text, in any case.
   * @param campId Camp id
   * @param code the code as a guardian typed it
   */
  public async getByCode(campId: string, code: string): Promise<DiscountCodeEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(discountCodes)
      .where(and(eq(discountCodes.campId, campId), sql`lower(${discountCodes.code}) = lower(${code})`));

    return row === undefined ? null : new DiscountCodeEntity(row);
  }

  /**
   * Get a Camp's Discount code by its text, in any case, and lock its row until the unit of work ends, so
   * its uses are taken one at a time.
   * @param campId Camp id
   * @param code the code as a guardian typed it
   */
  public async lockByCode(campId: string, code: string): Promise<DiscountCodeEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(discountCodes)
      .where(and(eq(discountCodes.campId, campId), sql`lower(${discountCodes.code}) = lower(${code})`))
      .for('update');

    return row === undefined ? null : new DiscountCodeEntity(row);
  }

  /**
   * Get the Discount code a Registration used, if any.
   * @param registrationId Registration id
   */
  public async getUsedBy(registrationId: string): Promise<DiscountCodeEntity | null> {
    const [row] = await this.unitOfWork.db
      .select({ code: discountCodes })
      .from(discountCodeUses)
      .innerJoin(
        discountCodes,
        and(
          eq(discountCodes.organisationId, discountCodeUses.organisationId),
          eq(discountCodes.id, discountCodeUses.discountCodeId),
        ),
      )
      .where(eq(discountCodeUses.registrationId, registrationId));

    return row === undefined ? null : new DiscountCodeEntity(row.code);
  }

  /**
   * Record a Registration's use of a Discount code.
   * @param discountCodeId Discount code id
   * @param registrationId Registration id
   * @param usedAt when the Registration was submitted
   */
  public async recordUse(discountCodeId: string, registrationId: string, usedAt: Date): Promise<void> {
    await this.unitOfWork.db
      .insert(discountCodeUses)
      .values({ discountCodeId, registrationId, usedAt, organisationId: this.unitOfWork.organisationId });
  }

  /**
   * Count the recorded uses of Discount codes, in one query.
   * @param ids Discount code ids
   * @returns uses by Discount code id; a code without uses is missing
   */
  public async countUses(ids: readonly string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ id: discountCodeUses.discountCodeId, uses: count() })
      .from(discountCodeUses)
      .where(inArray(discountCodeUses.discountCodeId, [...ids]))
      .groupBy(discountCodeUses.discountCodeId);

    return new Map(rows.map(({ id, uses }) => [id, uses]));
  }

  /**
   * Create a Discount code of a Camp of the current Organisation, switched on.
   * @param campId Camp id
   * @param input the code
   * @throws {Error} when the database returns no row
   */
  public async create(campId: string, input: CreateDiscountCode): Promise<DiscountCodeEntity> {
    const [row] = await this.unitOfWork.db
      .insert(discountCodes)
      .values({ ...input, campId, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Discount code was not created');
    }

    return new DiscountCodeEntity(row);
  }

  /**
   * Remove a Discount code of the current Organisation.
   * @param id Discount code id
   * @throws {NotFoundException} when no Discount code has this id in the current Organisation
   */
  public async remove(id: string): Promise<DiscountCodeEntity> {
    const [row] = await this.unitOfWork.db.delete(discountCodes).where(eq(discountCodes.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new DiscountCodeEntity(row);
  }

  /**
   * Update a Discount code of the current Organisation.
   * @param id Discount code id
   * @param input the fields to change
   * @throws {NotFoundException} when no Discount code has this id in the current Organisation
   */
  public async update(id: string, input: UpdateDiscountCode): Promise<DiscountCodeEntity> {
    const [row] = await this.unitOfWork.db.update(discountCodes).set(input).where(eq(discountCodes.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new DiscountCodeEntity(row);
  }
}
