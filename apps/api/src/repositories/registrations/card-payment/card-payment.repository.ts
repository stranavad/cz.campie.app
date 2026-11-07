import { Injectable } from '@nestjs/common';
import { eq, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { cardPayments } from '../../../db/schema.ts';

export type CardPaymentRow = InferSelectModel<typeof cardPayments>;

@Injectable()
export class CardPaymentRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record a card payment started at the gateway for a Registration of the current Organisation.
   * @param input the Registration, the gateway's transaction id, the amount and when
   * @throws {Error} when the database returns no row
   */
  public async create(input: {
    registrationId: string;
    transactionId: string;
    amount: number;
    createdAt: Date;
  }): Promise<CardPaymentRow> {
    const [row] = await this.unitOfWork.db
      .insert(cardPayments)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The card payment was not recorded');
    }

    return row;
  }

  /**
   * Get a card payment of the current Organisation by the gateway's transaction id.
   * @param transactionId the gateway's transaction id
   */
  public async getByTransactionId(transactionId: string): Promise<CardPaymentRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(cardPayments)
      .where(eq(cardPayments.transactionId, transactionId));

    return row ?? null;
  }
}
