import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { invoiceFiles, invoiceRequests } from '../../../db/schema.ts';
import { InvoiceRequestEntity, type InvoiceRequestInsertModel } from './invoice-request.entity.ts';

// The billing details and amount, and the state only when the camp sets it.
export type SaveInvoiceRequest = Omit<InvoiceRequestInsertModel, 'id' | 'organisationId' | 'registrationId'>;

export type InvoiceFileRow = typeof invoiceFiles.$inferSelect;

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
   * Mark an Invoice request invoiced on a date unless it has one already.
   * @param id Invoice request id
   * @param invoicedOn the Prague calendar date
   * @returns the Invoice request after, or null when it had a date
   */
  public async markInvoiced(id: string, invoicedOn: string): Promise<InvoiceRequestEntity | null> {
    const [row] = await this.unitOfWork.db
      .update(invoiceRequests)
      .set({ invoicedOn })
      .where(and(eq(invoiceRequests.id, id), isNull(invoiceRequests.invoicedOn)))
      .returning();

    return row === undefined ? null : new InvoiceRequestEntity(row);
  }

  /**
   * Attach a stored file to an Invoice request in the current Organisation.
   * @param input the Invoice request, file, uploader and time
   * @throws {Error} when the database returns no row
   */
  public async addFile(input: Omit<InvoiceFileRow, 'id' | 'organisationId'>): Promise<InvoiceFileRow> {
    const [row] = await this.unitOfWork.db
      .insert(invoiceFiles)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The invoice file was not saved');
    }

    return row;
  }

  /**
   * List the files of an Invoice request, oldest first.
   * @param invoiceRequestId Invoice request id
   */
  public async listFiles(invoiceRequestId: string): Promise<InvoiceFileRow[]> {
    return this.unitOfWork.db
      .select()
      .from(invoiceFiles)
      .where(eq(invoiceFiles.invoiceRequestId, invoiceRequestId))
      .orderBy(asc(invoiceFiles.uploadedAt), asc(invoiceFiles.id));
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
