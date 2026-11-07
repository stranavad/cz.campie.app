import { Controller } from '@nestjs/common';

import {
  previewOpenItemsReminderEndpoint,
  sendOpenItemsReminderEndpoint,
  type OpenItemsReminderParams,
  type OpenItemsReminderPreview,
  type OpenItemsRemindersSent,
} from '@repo/schema/checklist';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { OpenItemsReminderService } from './services/open-items-reminder.service.ts';

@Access('admin')
@Requires('registrations', 'write')
@Controller()
export class OpenItemsReminderController {
  constructor(private readonly reminders: OpenItemsReminderService) {}

  @Endpoint(previewOpenItemsReminderEndpoint)
  public preview(
    @EndpointParams(previewOpenItemsReminderEndpoint) { turnusId }: OpenItemsReminderParams,
  ): Promise<OpenItemsReminderPreview> {
    return this.reminders.preview(turnusId);
  }

  @Endpoint(sendOpenItemsReminderEndpoint)
  public send(
    @RequestActor() actor: Actor,
    @EndpointParams(sendOpenItemsReminderEndpoint) { turnusId }: OpenItemsReminderParams,
  ): Promise<OpenItemsRemindersSent> {
    return this.reminders.send(actor, turnusId);
  }
}
