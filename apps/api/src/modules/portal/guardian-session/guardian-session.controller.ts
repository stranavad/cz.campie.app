import { Controller, Ip, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  endGuardianSessionEndpoint,
  requestLoginLinkEndpoint,
  startGuardianSessionEndpoint,
  type RequestLoginLinkBody,
  type StartGuardianSessionBody,
} from '@repo/schema/portal';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from '../../../core/sessions/session-cookie.ts';
import { GuardianLoginService } from './services/guardian-login.service.ts';

// Public, not guardian: signing in needs no session, and a cookie whose session already ended is cleared
// all the same.
@Access('public')
@Controller()
export class GuardianSessionController {
  constructor(private readonly logins: GuardianLoginService) {}

  @Endpoint(requestLoginLinkEndpoint)
  public requestLoginLink(
    @EndpointBody(requestLoginLinkEndpoint) body: RequestLoginLinkBody,
    @Ip() ipAddress: string,
  ): Promise<void> {
    return this.logins.request(body, ipAddress);
  }

  // A session the browser already holds ends, rather than live on unseen beside the new one.
  @Endpoint(startGuardianSessionEndpoint)
  public async start(
    @EndpointBody(startGuardianSessionEndpoint) body: StartGuardianSessionBody,
    @Ip() ipAddress: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const session = await this.logins.startSession(body, ipAddress);
    const earlier = readSessionCookie(request, 'guardian');

    if (earlier !== null) {
      await this.logins.endSession(earlier);
    }

    writeSessionCookie(response, 'guardian', session);
  }

  @Endpoint(endGuardianSessionEndpoint)
  public async end(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = readSessionCookie(request, 'guardian');

    if (token !== null) {
      await this.logins.endSession(token);
    }

    clearSessionCookie(response, 'guardian');
  }
}
