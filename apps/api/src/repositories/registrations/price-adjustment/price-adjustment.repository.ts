import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { priceAdjustments } from '../../../db/schema.ts';
import { PriceAdjustmentEntity, type PriceAdjustmentInsertModel } from './price-adjustment.entity.ts';

export type CreatePriceAdjustment = Omit<PriceAdjustmentInsertModel, 'id' | 'organisationId'>;

// Price adjustments are append-only, like the ledger.
@Injectable()
export class PriceAdjustmentRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Registration's Price adjustments in the order they were added.
   * @param registrationId Registration id
   */
  public async listByRegistration(registrationId: string): Promise<PriceAdjustmentEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(priceAdjustments)
      .where(eq(priceAdjustments.registrationId, registrationId))
      .orderBy(asc(priceAdjustments.createdAt), asc(priceAdjustments.id));

    return rows.map((row) => new PriceAdjustmentEntity(row));
  }

  /**
   * Add a Price adjustment to a Registration in the current Organisation.
   * @param input the adjustment
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreatePriceAdjustment): Promise<PriceAdjustmentEntity> {
    const [row] = await this.unitOfWork.db
      .insert(priceAdjustments)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The Price adjustment was not added');
    }

    return new PriceAdjustmentEntity(row);
  }
}
