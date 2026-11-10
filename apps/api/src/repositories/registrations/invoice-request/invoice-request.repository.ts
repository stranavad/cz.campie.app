import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { invoiceRequests } from '../../../db/schema.ts';
import { InvoiceRequestEntity, type InvoiceRequestInsertModel } from './invoice-request.entity.ts';

// The billing details and amount; the state is the camp's to set.
export type SaveInvoiceRequest = Omit<
  InvoiceRequestInsertModel,
  'id' | 'organisationId' | 'registrationId' | 'invoicedOn' | 'invoiceNumber'
>;

// One Invoice request per Registration.
@Injectable()
export class InvoiceRequestRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get a Registration's Invoice request, or null without one.
   * @param registrationId Registration id
   */
  public async getByRegistration(registrationId: string): Promise<InvoiceRequestEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(invoiceRequests)
      .where(eq(invoiceRequests.registrationId, registrationId));

    return row === undefined ? null : new InvoiceRequestEntity(row);
  }

  /**
   * List the Invoice requests of Registrations, in one query.
   * @param registrationIds Registration ids
   * @returns each by its Registration id; one without is missing
   */
  public async listByRegistrations(registrationIds: readonly string[]): Promise<Map<string, InvoiceRequestEntity>> {
    if (registrationIds.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select()
      .from(invoiceRequests)
      .where(inArray(invoiceRequests.registrationId, [...registrationIds]));

    return new Map(rows.map((row) => [row.registrationId, new InvoiceRequestEntity(row)]));
  }

  /**
   * Add a Registration's Invoice request in the current Organisation, or replace its details and amount.
   * @param registrationId Registration id
   * @param input the billing details and amount
   * @throws {Error} when the database returns no row
   */
  public async save(registrationId: string, input: SaveInvoiceRequest): Promise<InvoiceRequestEntity> {
    const [row] = await this.unitOfWork.db
      .insert(invoiceRequests)
      .values({ ...input, registrationId, organisationId: this.unitOfWork.organisationId })
      .onConflictDoUpdate({ target: invoiceRequests.registrationId, set: input })
      .returning();

    if (row === undefined) {
      throw new Error('The Invoice request was not saved');
    }

    return new InvoiceRequestEntity(row);
  }

  /**
   * Remove a Registration's Invoice request.
   * @param registrationId Registration id
   * @throws {NotFoundException} when the Registration has none
   */
  public async remove(registrationId: string): Promise<void> {
    const rows = await this.unitOfWork.db
      .delete(invoiceRequests)
      .where(eq(invoiceRequests.registrationId, registrationId))
      .returning({ id: invoiceRequests.id });

    if (rows.length === 0) {
      throw new NotFoundException();
    }
  }
}
