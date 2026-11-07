import { Injectable } from '@nestjs/common';
import { asc, eq, inArray, isNotNull, sum } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { payments } from '../../../db/schema.ts';
import { PaymentEntity, type PaymentInsertModel } from './payment.entity.ts';

export type CreatePayment = Omit<PaymentInsertModel, 'id' | 'organisationId' | 'gatewayTransactionId'>;
export type CreateGatewayPayment = Omit<CreatePayment, 'source'> & { gatewayTransactionId: string };

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
   * Sum the entries of each of Registrations, in one query.
   * @param registrationIds Registration ids
   * @returns the sum by Registration id; one without entries is missing
   */
  public async sumOf(registrationIds: readonly string[]): Promise<Map<string, number>> {
    if (registrationIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ registrationId: payments.registrationId, total: sum(payments.amount).mapWith(Number) })
      .from(payments)
      .where(inArray(payments.registrationId, [...registrationIds]))
      .groupBy(payments.registrationId);

    return new Map(rows.map(({ registrationId, total }) => [registrationId, total ?? 0]));
  }
}
