import { Controller, Ip } from '@nestjs/common';

import {
  startPortalCardPaymentEndpoint,
  type GuardianRegistrationParams,
  type StartPortalCardPaymentBody,
} from '@repo/schema/portal';
import type { CardPaymentRedirect } from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CardPaymentService } from '../../registrations/card-payment/services/card-payment.service.ts';

@Access('guardian')
@Controller()
export class PortalCardPaymentController {
  constructor(private readonly cardPayments: CardPaymentService) {}

  @Endpoint(startPortalCardPaymentEndpoint)
  public start(
    @RequestGuardianEmail() email: string,
    @EndpointParams(startPortalCardPaymentEndpoint) { registrationId }: GuardianRegistrationParams,
    @EndpointBody(startPortalCardPaymentEndpoint) body: StartPortalCardPaymentBody,
    @Ip() ipAddress: string,
  ): Promise<CardPaymentRedirect> {
    return this.cardPayments.startForGuardian(email, registrationId, body, ipAddress);
  }
}
