import { Controller } from '@nestjs/common';

import {
  enterSupportAccessEndpoint,
  grantSupportAccessEndpoint,
  listSupportGrantsEndpoint,
  revokeSupportAccessEndpoint,
  type GrantSupportAccessBody,
  type SupportGrant,
  type SupportGrantParams,
} from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires, SupportEntry, type MemberAccess } from '../../../core/access/permission.ts';
import { RequestActor, RequestMember } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { SupportAccessService } from './services/support-access.service.ts';

@Access('admin')
@Controller()
export class SupportAccessController {
  constructor(private readonly support: SupportAccessService) {}

  @Endpoint(listSupportGrantsEndpoint)
  @Requires('owner')
  public list(): Promise<SupportGrant[]> {
    return this.support.list();
  }

  @Endpoint(grantSupportAccessEndpoint)
  @Requires('owner')
  public grant(
    @RequestActor() actor: Actor,
    @EndpointBody(grantSupportAccessEndpoint) body: GrantSupportAccessBody,
  ): Promise<SupportGrant> {
    return this.support.grant(actor, body);
  }

  @Endpoint(revokeSupportAccessEndpoint)
  @Requires('owner')
  public revoke(
    @RequestActor() actor: Actor,
    @EndpointParams(revokeSupportAccessEndpoint) { grantId }: SupportGrantParams,
  ): Promise<SupportGrant> {
    return this.support.revoke(actor, grantId);
  }

  @Endpoint(enterSupportAccessEndpoint)
  @Requires('member')
  @SupportEntry(true)
  public enter(@RequestActor() actor: Actor, @RequestMember() member: MemberAccess): Promise<void> {
    return this.support.enter(actor, member);
  }
}
