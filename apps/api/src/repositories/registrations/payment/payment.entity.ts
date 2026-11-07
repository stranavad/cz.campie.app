import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { PaymentEntry, PaymentSource } from '@repo/schema/registrations';

import type { payments } from '../../../db/schema.ts';

export type PaymentSelectModel = InferSelectModel<typeof payments>;
export type PaymentInsertModel = InferInsertModel<typeof payments>;

export class PaymentEntity {
  public readonly id: string;
  public readonly registrationId: string;
  public readonly source: PaymentSource;
  public readonly amount: number;
  public readonly paidOn: string;
  public readonly note: string;
  public readonly recordedAt: Date;

  constructor(row: PaymentSelectModel) {
    this.id = row.id;
    this.registrationId = row.registrationId;
    this.source = row.source;
    this.amount = row.amount;
    this.paidOn = row.paidOn;
    this.note = row.note;
    this.recordedAt = row.recordedAt;
  }

  toDto(): PaymentEntry {
    return {
      id: this.id,
      source: this.source,
      amount: this.amount,
      paidOn: this.paidOn,
      note: this.note,
      recordedAt: this.recordedAt.toISOString(),
    };
  }
}
