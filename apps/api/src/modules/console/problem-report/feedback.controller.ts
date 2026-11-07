import { Controller } from '@nestjs/common';

import { sendFeedbackEndpoint, type SendFeedbackBody } from '@repo/schema/console';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { ProblemReportService } from './services/problem-report.service.ts';

@Access('admin')
@Requires('member')
@Controller()
export class FeedbackController {
  constructor(private readonly reports: ProblemReportService) {}

  @Endpoint(sendFeedbackEndpoint)
  public send(@RequestActor() actor: Actor, @EndpointBody(sendFeedbackEndpoint) body: SendFeedbackBody): Promise<void> {
    return this.reports.sendFeedback(actor, body);
  }
}
