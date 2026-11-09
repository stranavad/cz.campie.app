import { Controller, Ip } from '@nestjs/common';

import {
  confirmGuardianEmailChangeEndpoint,
  type ConfirmGuardianEmailChangeBody,
  type ConfirmGuardianEmailChangeResponse,
} from '@repo/schema/portal';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { GuardianEmailChangeService } from './services/guardian-email-change.service.ts';

// Public: the new address follows its link from any browser, signed in or not.
@Access('public')
@Controller()
export class PublicEmailChangeController {
  constructor(private readonly emailChanges: GuardianEmailChangeService) {}

  @Endpoint(confirmGuardianEmailChangeEndpoint)
  public confirm(
    @EndpointBody(confirmGuardianEmailChangeEndpoint) body: ConfirmGuardianEmailChangeBody,
    @Ip() ipAddress: string,
  ): Promise<ConfirmGuardianEmailChangeResponse> {
    return this.emailChanges.confirm(body, ipAddress);
  }
}
