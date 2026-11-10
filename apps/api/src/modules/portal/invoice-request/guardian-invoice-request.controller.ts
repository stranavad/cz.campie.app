import { Controller } from '@nestjs/common';

import {
  removeGuardianInvoiceRequestEndpoint,
  saveGuardianInvoiceRequestEndpoint,
  type GuardianRegistrationParams,
} from '@repo/schema/portal';
import type { InvoiceRequest, InvoiceRequestBody } from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { GuardianInvoiceRequestService } from './services/guardian-invoice-request.service.ts';

@Access('guardian')
@Controller()
export class GuardianInvoiceRequestController {
  constructor(private readonly invoiceRequests: GuardianInvoiceRequestService) {}

  @Endpoint(saveGuardianInvoiceRequestEndpoint)
  public save(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(saveGuardianInvoiceRequestEndpoint) { registrationId }: GuardianRegistrationParams,
    @EndpointBody(saveGuardianInvoiceRequestEndpoint) body: InvoiceRequestBody,
  ): Promise<InvoiceRequest> {
    return this.invoiceRequests.save(actor, email, registrationId, body);
  }

  @Endpoint(removeGuardianInvoiceRequestEndpoint)
  public remove(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(removeGuardianInvoiceRequestEndpoint) { registrationId }: GuardianRegistrationParams,
  ): Promise<void> {
    return this.invoiceRequests.remove(actor, email, registrationId);
  }
}
