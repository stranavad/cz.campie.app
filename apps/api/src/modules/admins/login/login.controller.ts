import { Controller, Ip, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { logInEndpoint, logOutEndpoint, type LogInBody } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from '../../../core/sessions/session-cookie.ts';
import { LoginService } from './services/login.service.ts';

@Access('platform')
@Controller()
export class LoginController {
  constructor(private readonly logins: LoginService) {}

  @Endpoint(logInEndpoint)
  public async logIn(
    @EndpointBody(logInEndpoint) body: LogInBody,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    writeSessionCookie(response, 'admin', await this.logins.logIn(body, ipAddress));
  }

  // Platform access, not account: a cookie whose session has already ended is cleared all the same.
  @Endpoint(logOutEndpoint)
  public async logOut(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = readSessionCookie(request, 'admin');

    if (token !== null) {
      await this.logins.logOut(token);
    }

    clearSessionCookie(response, 'admin');
  }
}
