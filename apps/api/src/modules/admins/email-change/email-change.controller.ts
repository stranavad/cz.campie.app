import { Controller } from '@nestjs/common';

import { requestEmailChangeEndpoint, type RequestEmailChangeBody } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestAdminSession } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { EmailChangeService } from './services/email-change.service.ts';

@Access('account')
@Controller()
export class EmailChangeController {
  constructor(private readonly emailChanges: EmailChangeService) {}

  @Endpoint(requestEmailChangeEndpoint)
  public request(
    @RequestActor() actor: Actor,
    @RequestAdminSession() session: { secondFactor: boolean },
    @EndpointBody(requestEmailChangeEndpoint) body: RequestEmailChangeBody,
  ): Promise<void> {
    return this.emailChanges.request(actor, session, body);
  }
}
