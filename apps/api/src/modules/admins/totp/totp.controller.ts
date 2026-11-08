import { Controller, Res } from '@nestjs/common';
import type { Response } from 'express';

import {
  confirmTotpEnrolmentEndpoint,
  regenerateRecoveryCodesEndpoint,
  startTotpEnrolmentEndpoint,
  verifyTotpEndpoint,
  type ConfirmTotpEnrolmentBody,
  type RegenerateRecoveryCodesBody,
  type TotpEnabled,
  type TotpEnrolment,
  type VerifyTotpBody,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestAdminId, RequestAdminSession } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
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
  ): Promise<TotpEnabled> {
    const { session: passed, recoveryCodes } = await this.totp.confirmEnrolment(adminId, session.id, body.code);

    writeSessionCookie(response, 'admin', passed);

    return { recoveryCodes };
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

  @Endpoint(regenerateRecoveryCodesEndpoint)
  public async regenerateRecoveryCodes(
    @RequestActor() actor: Actor,
    @RequestAdminSession() session: { secondFactor: boolean },
    @EndpointBody(regenerateRecoveryCodesEndpoint) body: RegenerateRecoveryCodesBody,
  ): Promise<TotpEnabled> {
    return { recoveryCodes: await this.totp.regenerateRecoveryCodes(actor, session, body.code) };
  }
}
