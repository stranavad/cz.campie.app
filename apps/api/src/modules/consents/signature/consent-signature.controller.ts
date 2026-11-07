import { Controller, Headers } from '@nestjs/common';

import {
  getGuardianConsentEndpoint,
  listGuardianConsentsEndpoint,
  signConsentEndpoint,
  withdrawConsentEndpoint,
  type GuardianConsent,
  type GuardianConsentParams,
  type GuardianConsents,
  type GuardianConsentsParams,
  type SignConsentBody,
} from '@repo/schema/consents';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ConsentSignatureService } from './services/consent-signature.service.ts';

@Access('guardian')
@Controller()
export class ConsentSignatureController {
  constructor(private readonly signatures: ConsentSignatureService) {}

  @Endpoint(listGuardianConsentsEndpoint)
  public list(
    @RequestGuardianEmail() email: string,
    @EndpointParams(listGuardianConsentsEndpoint) { registrationId }: GuardianConsentsParams,
  ): Promise<GuardianConsents> {
    return this.signatures.list(email, registrationId);
  }

  @Endpoint(getGuardianConsentEndpoint)
  public get(
    @RequestGuardianEmail() email: string,
    @EndpointParams(getGuardianConsentEndpoint) params: GuardianConsentParams,
  ): Promise<GuardianConsent> {
    return this.signatures.get(email, params);
  }

  @Endpoint(signConsentEndpoint)
  public sign(
    @RequestActor() actor: Actor,
    @Headers('user-agent') userAgent: string | undefined,
    @EndpointParams(signConsentEndpoint) params: GuardianConsentParams,
    @EndpointBody(signConsentEndpoint) body: SignConsentBody,
  ): Promise<GuardianConsent> {
    return this.signatures.sign(actor, userAgent ?? '', params, body);
  }

  @Endpoint(withdrawConsentEndpoint)
  public withdraw(
    @RequestActor() actor: Actor,
    @EndpointParams(withdrawConsentEndpoint) params: GuardianConsentParams,
  ): Promise<GuardianConsent> {
    return this.signatures.withdraw(actor, params);
  }
}
