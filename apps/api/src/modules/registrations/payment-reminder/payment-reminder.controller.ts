import { Controller } from '@nestjs/common';

import {
  previewPaymentRemindersEndpoint,
  sendPaymentRemindersEndpoint,
  type ParticipantListParams,
  type PaymentReminderPreview,
  type PaymentRemindersSent,
  type SendPaymentRemindersBody,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { PaymentReminderService } from './services/payment-reminder.service.ts';

@Access('admin')
@Requires('registrations', 'write')
@Controller()
export class PaymentReminderController {
  constructor(private readonly reminders: PaymentReminderService) {}

  @Endpoint(previewPaymentRemindersEndpoint)
  public preview(
    @EndpointParams(previewPaymentRemindersEndpoint) { turnusId }: ParticipantListParams,
  ): Promise<PaymentReminderPreview> {
    return this.reminders.preview(turnusId);
  }

  @Endpoint(sendPaymentRemindersEndpoint)
  public send(
    @RequestActor() actor: Actor,
    @EndpointParams(sendPaymentRemindersEndpoint) { turnusId }: ParticipantListParams,
    @EndpointBody(sendPaymentRemindersEndpoint) body: SendPaymentRemindersBody,
  ): Promise<PaymentRemindersSent> {
    return this.reminders.send(actor, turnusId, body);
  }
}
