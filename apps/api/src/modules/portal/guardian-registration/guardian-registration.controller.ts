import { Controller } from '@nestjs/common';

import {
  getGuardianRegistrationEndpoint,
  listGuardianRegistrationsEndpoint,
  type GuardianPortal,
  type GuardianRegistration,
  type GuardianRegistrationParams,
} from '@repo/schema/portal';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { GuardianRegistrationService } from './services/guardian-registration.service.ts';

@Access('guardian')
@Controller()
export class GuardianRegistrationController {
  constructor(private readonly registrations: GuardianRegistrationService) {}

  @Endpoint(listGuardianRegistrationsEndpoint)
  public list(@RequestGuardianEmail() email: string): Promise<GuardianPortal> {
    return this.registrations.list(email);
  }

  @Endpoint(getGuardianRegistrationEndpoint)
  public get(
    @RequestGuardianEmail() email: string,
    @EndpointParams(getGuardianRegistrationEndpoint) { registrationId }: GuardianRegistrationParams,
  ): Promise<GuardianRegistration> {
    return this.registrations.get(email, registrationId);
  }
}
