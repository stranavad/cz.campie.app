import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AdminInvoiceRequestBody,
  InvoiceFile,
  InvoiceRequest,
  InvoiceRequestErrorCode,
} from '@repo/schema/registrations';
import { pragueDateOf } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { FileUpload } from '../../../../core/files/file-upload.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import type { InvoiceRequestEntity } from '../../../../repositories/registrations/invoice-request/invoice-request.entity.ts';
import { InvoiceRequestRepository } from '../../../../repositories/registrations/invoice-request/invoice-request.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

// Invoice files are PDFs only: what the camp's accounting program issues.
const INVOICE_FILE_LIMITS = { allow: ['application/pdf'] } as const;

// The camp's side of an Invoice request: changed at any time, its state set or cleared, and its invoices
// uploaded, which are only ever added. Permission (Registrations write) is the route's.
@Injectable()
export class InvoiceRequestService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly invoiceRequests: InvoiceRequestRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * Add or replace a Registration's Invoice request with its state, audited; the Camp's switch and the total
   * do not limit an admin.
   * @param actor the admin
   * @param registrationId Registration id
   * @param body the billing details, amount and state
   */
  public async save(actor: Actor, registrationId: string, body: AdminInvoiceRequestBody): Promise<InvoiceRequest> {
    await this.registrations.lockByIdOrThrow(registrationId);
    const before = await this.invoiceRequests.getByRegistration(registrationId);

    const after = await this.invoiceRequests.save(registrationId, body);

    await this.audit.record(actor, {
      action: before === null ? 'invoice_request.create' : 'invoice_request.update',
      target: { type: 'registration', id: registrationId },
      change: { before: before?.toDto() ?? null, after: after.toDto() },
    });

    return after.toDto();
  }

  /**
   * Remove a Registration's Invoice request, audited, while it holds no invoice file.
   * @param actor the admin
   * @param registrationId Registration id
   * @throws {NotFoundException} when the Registration has none
   * @throws {ConflictException} invoice_request_has_files when an invoice was uploaded to it
   */
  public async remove(actor: Actor, registrationId: string): Promise<void> {
    await this.registrations.lockByIdOrThrow(registrationId);
    const before = await this.invoiceRequests.getByRegistration(registrationId);

    if (before === null) {
      throw new NotFoundException();
    }

    if ((await this.invoiceRequests.listFiles(before.id)).length > 0) {
      const code: InvoiceRequestErrorCode = 'invoice_request_has_files';

      throw new ConflictException({ code, message: 'Invoice files are never removed' });
    }

    await this.invoiceRequests.remove(registrationId);

    await this.audit.record(actor, {
      action: 'invoice_request.remove',
      target: { type: 'registration', id: registrationId },
      change: { before: before.toDto(), after: null },
    });
  }

  /**
   * Add a PDF to a Registration's Invoice request, audited; the first one marks it invoiced today, in
   * Prague, when it has no date yet.
   * @param actor the admin
   * @param registrationId Registration id
   * @param upload the PDF
   * @throws {NotFoundException} when the Registration has no Invoice request
   */
  public async upload(actor: Actor, registrationId: string, upload: FileUpload): Promise<InvoiceFile> {
    // The Platform operator under a support grant acts under their own admin identity.
    if (actor.kind !== 'admin' && actor.kind !== 'operator') {
      throw new Error('Only an admin uploads an invoice');
    }

    await this.registrations.lockByIdOrThrow(registrationId);
    const invoiceRequest = await this.invoiceRequests.getByRegistration(registrationId);

    if (invoiceRequest === null) {
      throw new NotFoundException();
    }

    const isFirst = (await this.invoiceRequests.listFiles(invoiceRequest.id)).length === 0;
    const fileId = await this.files.store(upload, INVOICE_FILE_LIMITS);
    const now = this.clock.now();
    const added = await this.invoiceRequests.addFile({
      invoiceRequestId: invoiceRequest.id,
      fileId,
      uploadedByAdminId: actor.identity,
      uploadedAt: now,
    });

    await this.audit.record(actor, {
      action: 'invoice_file.create',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: { id: added.id, fileId, uploadedAt: added.uploadedAt } },
    });

    // Only the first invoice sets the date; a date the camp cleared afterwards stays cleared.
    const invoiced = isFirst ? await this.invoiceRequests.markInvoiced(invoiceRequest.id, pragueDateOf(now)) : null;

    if (invoiced !== null) {
      await this.audit.record(actor, {
        action: 'invoice_request.update',
        target: { type: 'registration', id: registrationId },
        change: { before: invoiceRequest.toDto(), after: invoiced.toDto() },
      });
    }

    return { id: added.id, name: upload.name, uploadedAt: now.toISOString(), file: await this.files.link(fileId) };
  }

  /**
   * List an Invoice request's files, oldest first, with their names and short-lived links. Call it only
   * after checking the caller may see them.
   * @param invoiceRequest the Invoice request, or null for none
   */
  public async filesOf(invoiceRequest: InvoiceRequestEntity | null): Promise<InvoiceFile[]> {
    if (invoiceRequest === null) {
      return [];
    }

    const rows = await this.invoiceRequests.listFiles(invoiceRequest.id);
    const fileIds = rows.map(({ fileId }) => fileId);
    const names = await this.files.names(fileIds);
    const links = await this.files.links(fileIds);

    return rows.flatMap(({ id, fileId, uploadedAt }) => {
      const name = names.get(fileId);
      const file = links.get(fileId);

      return name === undefined || file === undefined ? [] : [{ id, name, uploadedAt: uploadedAt.toISOString(), file }];
    });
  }
}
