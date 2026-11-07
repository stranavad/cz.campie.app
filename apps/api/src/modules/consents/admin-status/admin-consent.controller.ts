import { Controller } from '@nestjs/common';

import {
  downloadSignedConsentEndpoint,
  getRegistrationConsentsEndpoint,
  getTurnusConsentsEndpoint,
  type RegistrationConsents,
  type RegistrationConsentsParams,
  type SignedConsentParams,
  type TurnusConsents,
  type TurnusConsentsParams,
} from '@repo/schema/consents';
import type { FileLink } from '@repo/schema/files';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { AdminConsentService } from './services/admin-consent.service.ts';

@Access('admin')
@Requires('registrations', 'read')
@Controller()
export class AdminConsentController {
  constructor(private readonly consents: AdminConsentService) {}

  @Endpoint(getRegistrationConsentsEndpoint)
  public ofRegistration(
    @EndpointParams(getRegistrationConsentsEndpoint) { registrationId }: RegistrationConsentsParams,
  ): Promise<RegistrationConsents> {
    return this.consents.ofRegistration(registrationId);
  }

  @Endpoint(getTurnusConsentsEndpoint)
  public ofTurnus(
    @EndpointParams(getTurnusConsentsEndpoint) { turnusId }: TurnusConsentsParams,
  ): Promise<TurnusConsents> {
    return this.consents.ofTurnus(turnusId);
  }

  @Endpoint(downloadSignedConsentEndpoint)
  public download(
    @RequestActor() actor: Actor,
    @EndpointParams(downloadSignedConsentEndpoint) { signatureId }: SignedConsentParams,
  ): Promise<FileLink> {
    return this.consents.download(actor, signatureId);
  }
}
