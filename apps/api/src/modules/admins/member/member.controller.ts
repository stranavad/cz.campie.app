import { Controller } from '@nestjs/common';

import {
  listMembersEndpoint,
  removeMemberEndpoint,
  updateMemberEndpoint,
  type Member,
  type RemoveMemberParams,
  type UpdateMemberBody,
  type UpdateMemberParams,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { MembershipService } from '../membership/services/membership.service.ts';

@Access('admin')
@Requires('owner')
@Controller()
export class MemberController {
  constructor(private readonly memberships: MembershipService) {}

  @Endpoint(listMembersEndpoint)
  public async list(): Promise<Member[]> {
    return (await this.memberships.listMembers()).map((member) => member.toDto());
  }

  @Endpoint(updateMemberEndpoint)
  public async update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateMemberEndpoint) { memberId }: UpdateMemberParams,
    @EndpointBody(updateMemberEndpoint) body: UpdateMemberBody,
  ): Promise<Member> {
    return (await this.memberships.update(actor, memberId, body)).toDto();
  }

  @Endpoint(removeMemberEndpoint)
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeMemberEndpoint) { memberId }: RemoveMemberParams,
  ): Promise<void> {
    return this.memberships.remove(actor, memberId);
  }
}
