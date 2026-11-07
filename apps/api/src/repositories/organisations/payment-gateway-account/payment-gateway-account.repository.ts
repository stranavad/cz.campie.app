import { Injectable } from '@nestjs/common';
import { eq, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import type { Encrypted } from '../../../core/encryption/cipher.ts';
import { paymentGatewayAccounts } from '../../../db/schema.ts';

export type PaymentGatewayAccountRow = InferSelectModel<typeof paymentGatewayAccounts>;

// The current Organisation's Comgate account: one row or none.
@Injectable()
export class PaymentGatewayAccountRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get the current Organisation's account, its secret still encrypted.
   */
  public async get(): Promise<PaymentGatewayAccountRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(paymentGatewayAccounts)
      .where(eq(paymentGatewayAccounts.organisationId, this.unitOfWork.organisationId));

    return row ?? null;
  }

  /**
   * Store the current Organisation's account, replacing the one it had.
   * @param input the merchant id, the encrypted secret and when
   * @throws {Error} when the database returns no row
   */
  public async save(input: {
    merchantId: string;
    secret: Encrypted;
    updatedAt: Date;
  }): Promise<PaymentGatewayAccountRow> {
    const [row] = await this.unitOfWork.db
      .insert(paymentGatewayAccounts)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .onConflictDoUpdate({ target: paymentGatewayAccounts.organisationId, set: input })
      .returning();

    if (row === undefined) {
      throw new Error('The payment gateway account was not saved');
    }

    return row;
  }

  /**
   * Remove the current Organisation's account, if it has one.
   */
  public async remove(): Promise<void> {
    await this.unitOfWork.db
      .delete(paymentGatewayAccounts)
      .where(eq(paymentGatewayAccounts.organisationId, this.unitOfWork.organisationId));
  }
}
