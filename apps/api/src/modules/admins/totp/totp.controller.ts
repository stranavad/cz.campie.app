import { Controller, Res } from '@nestjs/common';
import type { Response } from 'express';

import {
  confirmTotpEnrolmentEndpoint,
  startTotpEnrolmentEndpoint,
  verifyTotpEndpoint,
  type ConfirmTotpEnrolmentBody,
  type TotpEnrolment,
  type VerifyTotpBody,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestAdminId, RequestAdminSession } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { writeSessionCookie } from '../../../core/sessions/session-cookie.ts';
import { TotpService } from './services/totp.service.ts';

@Access('account')
@Controller()
export class TotpController {
  constructor(private readonly totp: TotpService) {}

  @Endpoint(startTotpEnrolmentEndpoint)
  public startEnrolment(@RequestAdminId() adminId: string): Promise<TotpEnrolment> {
    return this.totp.startEnrolment(adminId);
  }

  @Endpoint(confirmTotpEnrolmentEndpoint)
  public async confirmEnrolment(
    @RequestAdminId() adminId: string,
    @RequestAdminSession() session: { id: string },
    @EndpointBody(confirmTotpEnrolmentEndpoint) body: ConfirmTotpEnrolmentBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    writeSessionCookie(response, 'admin', await this.totp.confirmEnrolment(adminId, session.id, body.code));
  }

  @Endpoint(verifyTotpEndpoint)
  public async verify(
    @RequestAdminId() adminId: string,
    @RequestAdminSession() session: { id: string },
    @EndpointBody(verifyTotpEndpoint) body: VerifyTotpBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    writeSessionCookie(response, 'admin', await this.totp.verify(adminId, session.id, body.code));
  }
}
