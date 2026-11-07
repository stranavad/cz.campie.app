import { Controller } from '@nestjs/common';

import {
  getRegistrationDetailEndpoint,
  getRegistrationHistoryEndpoint,
  verifyClaimedDiscountEndpoint,
  type HistoryEntry,
  type RegistrationDetail,
  type RegistrationParams,
  type VerifyClaimedDiscountBody,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { allows, Requires, type MemberAccess } from '../../../core/access/permission.ts';
import { RequestActor, RequestMember } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { RegistrationDetailService } from './services/registration-detail.service.ts';

@Access('admin')
@Controller()
export class RegistrationDetailController {
  constructor(private readonly details: RegistrationDetailService) {}

  @Endpoint(getRegistrationDetailEndpoint)
  @Requires('registrations', 'read')
  public get(
    @EndpointParams(getRegistrationDetailEndpoint) { registrationId }: RegistrationParams,
  ): Promise<RegistrationDetail> {
    return this.details.get(registrationId);
  }

  @Endpoint(getRegistrationHistoryEndpoint)
  @Requires('registrations', 'read')
  public history(
    @EndpointParams(getRegistrationHistoryEndpoint) { registrationId }: RegistrationParams,
    @RequestMember() member: MemberAccess,
  ): Promise<HistoryEntry[]> {
    return this.details.history(registrationId, allows(member, { area: 'health', level: 'read' }));
  }

  @Endpoint(verifyClaimedDiscountEndpoint)
  @Requires('registrations', 'write')
  public verifyClaimedDiscount(
    @RequestActor() actor: Actor,
    @EndpointParams(verifyClaimedDiscountEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(verifyClaimedDiscountEndpoint) body: VerifyClaimedDiscountBody,
  ): Promise<RegistrationDetail> {
    return this.details.verifyClaimedDiscount(actor, registrationId, body);
  }
}
