import { Controller, Ip, Res } from '@nestjs/common';
import type { Response } from 'express';

import { signUpOrganisationEndpoint, type SignUpOrganisationBody } from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { writeSessionCookie } from '../../../core/sessions/session-cookie.ts';
import { OrganisationService } from './services/organisation.service.ts';

@Access('platform')
@Controller()
export class OrganisationController {
  constructor(private readonly organisations: OrganisationService) {}

  @Endpoint(signUpOrganisationEndpoint)
  public async signUp(
    @EndpointBody(signUpOrganisationEndpoint) body: SignUpOrganisationBody,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    writeSessionCookie(response, 'admin', await this.organisations.signUp(body, ipAddress));
  }
}
