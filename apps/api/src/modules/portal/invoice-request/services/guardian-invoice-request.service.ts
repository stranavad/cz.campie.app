import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { InvoiceRequest, InvoiceRequestBody, InvoiceRequestErrorCode } from '@repo/schema/registrations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import type { InvoiceRequestEntity } from '../../../../repositories/registrations/invoice-request/invoice-request.entity.ts';
import { InvoiceRequestRepository } from '../../../../repositories/registrations/invoice-request/invoice-request.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { LedgerService } from '../../../registrations/ledger/services/ledger.service.ts';

// A guardian's Invoice request in the portal: theirs to add, change or remove until the camp invoices it.
@Injectable()
export class GuardianInvoiceRequestService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly invoiceRequests: InvoiceRequestRepository,
    private readonly ledgers: LedgerService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Add or replace the Invoice request of one of the guardian's Registrations, audited, while the camp has not
   * invoiced it; a new one only while the Camp offers it. The amount is at most the total now.
   * @param actor the guardian
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @param body the billing details and amount
   * @throws {ConflictException} invoice_request_unavailable when the Camp does not offer a new one;
   * invoice_request_invoiced once the camp has invoiced it
   * @throws {BadRequestException} invoice_amount_above_total when the amount is above the total
   */
  public async save(
    actor: Actor,
    email: string,
    registrationId: string,
    body: InvoiceRequestBody,
  ): Promise<InvoiceRequest> {
    const { registration, invoiceRequest: before } = await this.editable(email, registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    // The switch controls the offer of a new one; an existing one stays the guardian's to change.
    if (before === null && !(await this.camps.getByIdOrThrow(turnus.campId)).modules.includes('invoiceRequests')) {
      const code: InvoiceRequestErrorCode = 'invoice_request_unavailable';

      throw new ConflictException({ code, message: 'The Camp does not offer an Invoice request' });
    }

    const { total } = await this.ledgers.balanceOf(registrationId);

    if (body.amount > total) {
      const code: InvoiceRequestErrorCode = 'invoice_amount_above_total';

      throw new BadRequestException({
        code,
        message: 'The amount to invoice is above the total',
        fields: [{ path: ['amount'], code, params: { max: total } }],
      });
    }

    const after = await this.invoiceRequests.save(registrationId, body);

    await this.audit.record(actor, {
      action: before === null ? 'invoice_request.create' : 'invoice_request.update',
      target: { type: 'registration', id: registrationId },
      change: { before: before?.toDto() ?? null, after: after.toDto() },
    });

    return after.toDto();
  }

  /**
   * Remove the Invoice request of one of the guardian's Registrations, audited, while the camp has not
   * invoiced it.
   * @param actor the guardian
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when the Registration has none
   */
  public async remove(actor: Actor, email: string, registrationId: string): Promise<void> {
    const { invoiceRequest: before } = await this.editable(email, registrationId);

    if (before === null) {
      throw new NotFoundException();
    }

    await this.invoiceRequests.remove(registrationId);

    await this.audit.record(actor, {
      action: 'invoice_request.remove',
      target: { type: 'registration', id: registrationId },
      change: { before: before.toDto(), after: null },
    });
  }

  /**
   * Find the Invoice request of one of the guardian's Registrations, locking the Registration so the camp
   * cannot invoice it meanwhile.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when no Registration of the Organisation with this id names the guardian
   * @throws {ConflictException} invoice_request_invoiced once the camp has invoiced it
   */
  private async editable(
    email: string,
    registrationId: string,
  ): Promise<{ registration: RegistrationEntity; invoiceRequest: InvoiceRequestEntity | null }> {
    if ((await this.registrations.getByGuardian(email, registrationId)) === null) {
      throw new NotFoundException();
    }

    const registration = await this.registrations.lockByIdOrThrow(registrationId);
    const invoiceRequest = await this.invoiceRequests.getByRegistration(registrationId);

    if (invoiceRequest !== null && invoiceRequest.invoicedOn !== null) {
      const code: InvoiceRequestErrorCode = 'invoice_request_invoiced';

      throw new ConflictException({ code, message: 'The camp has invoiced it already' });
    }

    return { registration, invoiceRequest };
  }
}
