import { Controller, Ip } from '@nestjs/common';

import { requestEmailVerificationEndpoint } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestAdminId } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint } from '../../../core/http/endpoint.decorator.ts';
import { EmailVerificationService } from './services/email-verification.service.ts';

// In an Organisation, whose log records the verification: an admin not yet verified is a member of the one
// they signed up only, since accepting an invitation verifies the email.
@Access('admin')
@Requires('member')
@Controller()
export class EmailVerificationController {
  constructor(private readonly emailVerifications: EmailVerificationService) {}

  @Endpoint(requestEmailVerificationEndpoint)
  public resend(@RequestAdminId() adminId: string, @Ip() ipAddress: string): Promise<void> {
    return this.emailVerifications.resend(adminId, ipAddress);
  }
}
