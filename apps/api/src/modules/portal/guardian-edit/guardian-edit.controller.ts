import { Controller } from '@nestjs/common';

import {
  addGuardianEndpoint,
  answerNewFieldsEndpoint,
  getGuardianEditEndpoint,
  requestGuardianEmailChangeEndpoint,
  updateGuardianContactEndpoint,
  type AddGuardianBody,
  type AnswerNewFieldsBody,
  type GuardianContactBody,
  type GuardianEdit,
  type GuardianEmailChangeBody,
  type GuardianPositionParams,
  type GuardianRegistrationParams,
} from '@repo/schema/portal';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { GuardianEditService } from './services/guardian-edit.service.ts';
import { GuardianEmailChangeService } from './services/guardian-email-change.service.ts';

@Access('guardian')
@Controller()
export class GuardianEditController {
  constructor(
    private readonly edits: GuardianEditService,
    private readonly emailChanges: GuardianEmailChangeService,
  ) {}

  @Endpoint(getGuardianEditEndpoint)
  public get(
    @RequestGuardianEmail() email: string,
    @EndpointParams(getGuardianEditEndpoint) { registrationId }: GuardianRegistrationParams,
  ): Promise<GuardianEdit> {
    return this.edits.get(email, registrationId);
  }

  @Endpoint(updateGuardianContactEndpoint)
  public updateContact(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(updateGuardianContactEndpoint) { registrationId, position }: GuardianPositionParams,
    @EndpointBody(updateGuardianContactEndpoint) body: GuardianContactBody,
  ): Promise<GuardianEdit> {
    return this.edits.updateContact(actor, email, registrationId, position, body);
  }

  @Endpoint(addGuardianEndpoint)
  public addGuardian(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(addGuardianEndpoint) { registrationId }: GuardianRegistrationParams,
    @EndpointBody(addGuardianEndpoint) body: AddGuardianBody,
  ): Promise<GuardianEdit> {
    return this.edits.addGuardian(actor, email, registrationId, body);
  }

  @Endpoint(requestGuardianEmailChangeEndpoint)
  public requestEmailChange(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(requestGuardianEmailChangeEndpoint) { registrationId, position }: GuardianPositionParams,
    @EndpointBody(requestGuardianEmailChangeEndpoint) body: GuardianEmailChangeBody,
  ): Promise<void> {
    return this.emailChanges.request(actor, email, registrationId, position, body);
  }

  @Endpoint(answerNewFieldsEndpoint)
  public answerNewFields(
    @RequestActor() actor: Actor,
    @RequestGuardianEmail() email: string,
    @EndpointParams(answerNewFieldsEndpoint) { registrationId }: GuardianRegistrationParams,
    @EndpointBody(answerNewFieldsEndpoint) body: AnswerNewFieldsBody,
  ): Promise<GuardianEdit> {
    return this.edits.answerNewFields(actor, email, registrationId, body);
  }
}
