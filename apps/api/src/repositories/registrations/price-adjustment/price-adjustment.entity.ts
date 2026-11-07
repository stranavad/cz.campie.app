import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { PriceAdjustment } from '@repo/schema/registrations';

import type { priceAdjustments } from '../../../db/schema.ts';

export type PriceAdjustmentSelectModel = InferSelectModel<typeof priceAdjustments>;
export type PriceAdjustmentInsertModel = InferInsertModel<typeof priceAdjustments>;

export class PriceAdjustmentEntity {
  public readonly id: string;
  public readonly registrationId: string;
  public readonly amount: number;
  public readonly note: string;
  public readonly createdAt: Date;

  constructor(row: PriceAdjustmentSelectModel) {
    this.id = row.id;
    this.registrationId = row.registrationId;
    this.amount = row.amount;
    this.note = row.note;
    this.createdAt = row.createdAt;
  }

  toDto(): PriceAdjustment {
    return { id: this.id, amount: this.amount, note: this.note, createdAt: this.createdAt.toISOString() };
  }
}
