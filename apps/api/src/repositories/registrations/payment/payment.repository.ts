import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, isNotNull, lte, sum } from 'drizzle-orm';

import type { Payer } from '@repo/schema/pricing';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { payments, registrations } from '../../../db/schema.ts';
import { PaymentEntity, type PaymentInsertModel } from './payment.entity.ts';

export type CreatePayment = Omit<PaymentInsertModel, 'id' | 'organisationId' | 'gatewayTransactionId'>;
export type CreateGatewayPayment = Omit<CreatePayment, 'source' | 'payer'> & { gatewayTransactionId: string };

// The ledger is append-only: entries are added and read, never changed or removed.
@Injectable()
export class PaymentRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List a Registration's ledger entries in the order they were recorded.
   * @param registrationId Registration id
   */
  public async listByRegistration(registrationId: string): Promise<PaymentEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(payments)
      .where(eq(payments.registrationId, registrationId))
      .orderBy(asc(payments.recordedAt), asc(payments.id));

    return rows.map((row) => new PaymentEntity(row));
  }

  /**
   * Get a ledger entry of the current Organisation by id.
   * @param id entry id
   */
  public async getById(id: string): Promise<PaymentEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(payments).where(eq(payments.id, id));

    return row === undefined ? null : new PaymentEntity(row);
  }

  /**
   * Add an entry to a Registration's ledger in the current Organisation.
   * @param input the entry
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreatePayment): Promise<PaymentEntity> {
    const [row] = await this.unitOfWork.db
      .insert(payments)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The payment was not recorded');
    }

    return new PaymentEntity(row);
  }

  /**
   * Add the gateway's entry for one of its transactions, unless the transaction already has one.
   * @param input the entry and the gateway's transaction id
   * @returns the entry, or null when the transaction was recorded before
   */
  public async createGatewayEntry(input: CreateGatewayPayment): Promise<PaymentEntity | null> {
    const [row] = await this.unitOfWork.db
      .insert(payments)
      .values({ ...input, source: 'gateway', organisationId: this.unitOfWork.organisationId })
      .onConflictDoNothing({
        target: [payments.organisationId, payments.gatewayTransactionId],
        where: isNotNull(payments.gatewayTransactionId),
      })
      .returning();

    return row === undefined ? null : new PaymentEntity(row);
  }

  /**
   * Tell whether the current Organisation's ledger has recorded a gateway transaction.
   * @param transactionId the gateway's transaction id
   */
  public async hasGatewayEntry(transactionId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.gatewayTransactionId, transactionId));

    return row !== undefined;
  }

  /**
   * List the current Organisation's ledger entries paid within dates, with each one's Variable symbol,
   * oldest payment first.
   * @param from the first payment date, inclusive
   * @param to the last payment date, inclusive
   */
  public async listPaidWithin(from: string, to: string): Promise<(PaymentEntity & { variableSymbol: string })[]> {
    const rows = await this.unitOfWork.db
      .select({ payment: payments, variableSymbol: registrations.variableSymbol })
      .from(payments)
      .innerJoin(
        registrations,
        and(eq(registrations.organisationId, payments.organisationId), eq(registrations.id, payments.registrationId)),
      )
      .where(and(gte(payments.paidOn, from), lte(payments.paidOn, to)))
      .orderBy(asc(payments.paidOn), asc(payments.recordedAt), asc(payments.id));

    return rows.map(({ payment, variableSymbol }) => Object.assign(new PaymentEntity(payment), { variableSymbol }));
  }

  /**
   * Sum the entries of each of Registrations by payer, in one query.
   * @param registrationIds Registration ids
   * @returns the sums by Registration id; one without entries is missing
   */
  public async sumOf(registrationIds: readonly string[]): Promise<Map<string, { amount: number; payer: Payer }[]>> {
    if (registrationIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({
        registrationId: payments.registrationId,
        payer: payments.payer,
        total: sum(payments.amount).mapWith(Number),
      })
      .from(payments)
      .where(inArray(payments.registrationId, [...registrationIds]))
      .groupBy(payments.registrationId, payments.payer);
    const sums = new Map<string, { amount: number; payer: Payer }[]>();

    for (const { registrationId, payer, total } of rows) {
      sums.set(registrationId, [...(sums.get(registrationId) ?? []), { amount: total ?? 0, payer }]);
    }

    return sums;
  }
}
