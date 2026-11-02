import { Controller } from '@nestjs/common';

import {
  createInvitationEndpoint,
  listInvitationsEndpoint,
  revokeInvitationEndpoint,
  type CreateInvitationBody,
  type Invitation,
  type RevokeInvitationParams,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { InvitationService } from './services/invitation.service.ts';

@Access('admin')
@Requires('owner')
@Controller()
export class InvitationController {
  constructor(private readonly invitations: InvitationService) {}

  @Endpoint(listInvitationsEndpoint)
  public async list(): Promise<Invitation[]> {
    return (await this.invitations.list()).map((invitation) => invitation.toDto());
  }

  @Endpoint(createInvitationEndpoint)
  public async create(
    @RequestActor() actor: Actor,
    @EndpointBody(createInvitationEndpoint) body: CreateInvitationBody,
  ): Promise<Invitation> {
    return (await this.invitations.invite(actor, body)).toDto();
  }

  @Endpoint(revokeInvitationEndpoint)
  public revoke(
    @RequestActor() actor: Actor,
    @EndpointParams(revokeInvitationEndpoint) { invitationId }: RevokeInvitationParams,
  ): Promise<void> {
    return this.invitations.revoke(actor, invitationId);
  }
}
