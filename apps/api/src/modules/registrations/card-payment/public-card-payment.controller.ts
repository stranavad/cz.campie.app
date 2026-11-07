import { Controller, Ip } from '@nestjs/common';

import {
  getCardPaymentResultEndpoint,
  startSubmittedCardPaymentEndpoint,
  type CardPaymentRedirect,
  type CardPaymentResult,
  type CardPaymentResultParams,
  type StartSubmittedCardPaymentBody,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CardPaymentService } from './services/card-payment.service.ts';

@Access('public')
@Controller()
export class PublicCardPaymentController {
  constructor(private readonly cardPayments: CardPaymentService) {}

  @Endpoint(startSubmittedCardPaymentEndpoint)
  public start(
    @EndpointBody(startSubmittedCardPaymentEndpoint) { idempotencyKey }: StartSubmittedCardPaymentBody,
    @Ip() ipAddress: string,
  ): Promise<CardPaymentRedirect> {
    return this.cardPayments.startAfterSubmission(idempotencyKey, ipAddress);
  }

  @Endpoint(getCardPaymentResultEndpoint)
  public result(
    @EndpointParams(getCardPaymentResultEndpoint) { transactionId }: CardPaymentResultParams,
    @Ip() ipAddress: string,
  ): Promise<CardPaymentResult> {
    return this.cardPayments.result(transactionId, ipAddress);
  }
}
