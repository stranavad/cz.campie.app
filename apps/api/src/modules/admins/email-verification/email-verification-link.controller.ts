import { Controller, Ip } from '@nestjs/common';

import { verifyEmailEndpoint, type VerifyEmailBody } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { EmailVerificationService } from './services/email-verification.service.ts';

// Opened from the mail, perhaps in another browser than the one signed in: the emailed token is the
// permission.
@Access('platform')
@Controller()
export class EmailVerificationLinkController {
  constructor(private readonly emailVerifications: EmailVerificationService) {}

  @Endpoint(verifyEmailEndpoint)
  public complete(@EndpointBody(verifyEmailEndpoint) body: VerifyEmailBody, @Ip() ipAddress: string): Promise<void> {
    return this.emailVerifications.complete(body, ipAddress);
  }
}
