import { Controller, Ip } from '@nestjs/common';

import { confirmEmailChangeEndpoint, type ConfirmEmailChangeBody } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { EmailChangeService } from './services/email-change.service.ts';

// Opened from the mail, perhaps in another browser than the one signed in: the emailed token is the
// permission.
@Access('platform')
@Controller()
export class EmailChangeLinkController {
  constructor(private readonly emailChanges: EmailChangeService) {}

  @Endpoint(confirmEmailChangeEndpoint)
  public confirm(
    @EndpointBody(confirmEmailChangeEndpoint) body: ConfirmEmailChangeBody,
    @Ip() ipAddress: string,
  ): Promise<void> {
    return this.emailChanges.confirm(body, ipAddress);
  }
}
