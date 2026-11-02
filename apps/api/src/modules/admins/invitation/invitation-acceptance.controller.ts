import { Controller, Ip, Res } from '@nestjs/common';
import type { Response } from 'express';

import {
  acceptInvitationEndpoint,
  lookUpInvitationEndpoint,
  type AcceptInvitationBody,
  type InvitationPreview,
  type LookUpInvitationBody,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { writeSessionCookie } from '../../../core/sessions/session-cookie.ts';
import { InvitationService } from './services/invitation.service.ts';

// The invitee's side, on the main host before they are a member: the emailed token is the permission.
@Access('platform')
@Controller()
export class InvitationAcceptanceController {
  constructor(private readonly invitations: InvitationService) {}

  @Endpoint(lookUpInvitationEndpoint)
  public lookUp(@EndpointBody(lookUpInvitationEndpoint) { token }: LookUpInvitationBody): Promise<InvitationPreview> {
    return this.invitations.lookUp(token);
  }

  @Endpoint(acceptInvitationEndpoint)
  public async accept(
    @EndpointBody(acceptInvitationEndpoint) body: AcceptInvitationBody,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const session = await this.invitations.accept(body, ipAddress);

    if (session !== null) {
      writeSessionCookie(response, 'admin', session);
    }
  }
}
