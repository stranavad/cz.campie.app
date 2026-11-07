import { Controller, Ip } from '@nestjs/common';

import {
  requestPasswordResetEndpoint,
  resetPasswordEndpoint,
  type RequestPasswordResetBody,
  type ResetPasswordBody,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { PasswordResetService } from './services/password-reset.service.ts';

@Access('platform')
@Controller()
export class PasswordResetController {
  constructor(private readonly passwordResets: PasswordResetService) {}

  @Endpoint(requestPasswordResetEndpoint)
  public request(
    @EndpointBody(requestPasswordResetEndpoint) body: RequestPasswordResetBody,
    @Ip() ipAddress: string,
  ): Promise<void> {
    return this.passwordResets.request(body, ipAddress);
  }

  @Endpoint(resetPasswordEndpoint)
  public complete(@EndpointBody(resetPasswordEndpoint) body: ResetPasswordBody): Promise<void> {
    return this.passwordResets.complete(body);
  }
}
