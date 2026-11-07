import { Controller, Ip } from '@nestjs/common';

import { comgateNotificationEndpoint, type ComgateNotificationBody } from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { CardPaymentService } from './services/card-payment.service.ts';

@Access('gateway')
@Controller()
export class ComgateNotificationController {
  constructor(private readonly cardPayments: CardPaymentService) {}

  @Endpoint(comgateNotificationEndpoint)
  public async notify(
    @EndpointBody(comgateNotificationEndpoint) body: ComgateNotificationBody,
    @Ip() ipAddress: string,
  ): Promise<void> {
    await this.cardPayments.handleNotification(body.transId, ipAddress);
  }
}
