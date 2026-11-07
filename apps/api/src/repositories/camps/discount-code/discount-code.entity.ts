import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { DiscountCodeResource, DiscountCodeStatus } from '@repo/schema/camps';
import type { DiscountCode, DiscountCodeKind } from '@repo/schema/pricing';

import type { discountCodes } from '../../../db/schema.ts';

export type DiscountCodeSelectModel = InferSelectModel<typeof discountCodes>;
export type DiscountCodeInsertModel = InferInsertModel<typeof discountCodes>;

export class DiscountCodeEntity {
  public readonly id: string;
  public readonly campId: string;
  public readonly code: string;
  public readonly kind: DiscountCodeKind;
  public readonly value: number;
  public readonly usageLimit: number | null;
  public readonly expiresOn: string | null;
  public readonly active: boolean;

  constructor(row: DiscountCodeSelectModel) {
    this.id = row.id;
    this.campId = row.campId;
    this.code = row.code;
    this.kind = row.kind;
    this.value = row.value;
    this.usageLimit = row.usageLimit;
    this.expiresOn = row.expiresOn;
    this.active = row.active;
  }

  toDto(uses: number, status: DiscountCodeStatus): DiscountCodeResource {
    return {
      id: this.id,
      campId: this.campId,
      code: this.code,
      kind: this.kind,
      value: this.value,
      usageLimit: this.usageLimit,
      expiresOn: this.expiresOn,
      active: this.active,
      uses,
      status,
    };
  }

  // The code as pricing takes it.
  toPricing(): DiscountCode {
    return { code: this.code, kind: this.kind, value: this.value };
  }
}
