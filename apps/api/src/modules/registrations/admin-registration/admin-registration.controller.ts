import { Controller } from '@nestjs/common';

import type { CampParams } from '@repo/schema/camps';
import {
  addParticipantEndpoint,
  createRegistrationEndpoint,
  editAnswersEndpoint,
  editGuardianEndpoint,
  getTurnusFormEndpoint,
  moveRegistrationEndpoint,
  previewAddParticipantEndpoint,
  previewEditAnswersEndpoint,
  type AddParticipantBody,
  type AdminGuardianParams,
  type EditAnswersBody,
  type EditGuardianBody,
  type MoveRegistrationBody,
  type PriceChange,
  type RegistrationDetail,
  type RegistrationParams,
  type SaveAddParticipantBody,
  type SaveEditAnswersBody,
  type SubmitRegistrationBody,
  type SubmittedRegistration,
  type TurnusForm,
  type TurnusFormParams,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { RegistrationService } from '../registration/services/registration.service.ts';
import { AdminRegistrationService } from './services/admin-registration.service.ts';

@Access('admin')
@Requires('registrations', 'write')
@Controller()
export class AdminRegistrationController {
  constructor(
    private readonly registrations: RegistrationService,
    private readonly admin: AdminRegistrationService,
  ) {}

  @Endpoint(createRegistrationEndpoint)
  public create(
    @RequestActor() actor: Actor,
    @EndpointParams(createRegistrationEndpoint) { campId }: CampParams,
    @EndpointBody(createRegistrationEndpoint) body: SubmitRegistrationBody,
  ): Promise<SubmittedRegistration> {
    return this.registrations.createByAdmin(actor, campId, body);
  }

  @Endpoint(getTurnusFormEndpoint)
  public formOf(@EndpointParams(getTurnusFormEndpoint) { turnusId }: TurnusFormParams): Promise<TurnusForm> {
    return this.admin.formOf(turnusId);
  }

  @Endpoint(previewEditAnswersEndpoint)
  public previewAnswers(
    @EndpointParams(previewEditAnswersEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(previewEditAnswersEndpoint) body: EditAnswersBody,
  ): Promise<PriceChange> {
    return this.admin.previewAnswers(registrationId, body);
  }

  @Endpoint(editAnswersEndpoint)
  public editAnswers(
    @RequestActor() actor: Actor,
    @EndpointParams(editAnswersEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(editAnswersEndpoint) body: SaveEditAnswersBody,
  ): Promise<RegistrationDetail> {
    return this.admin.editAnswers(actor, registrationId, body);
  }

  @Endpoint(previewAddParticipantEndpoint)
  public previewParticipant(
    @EndpointParams(previewAddParticipantEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(previewAddParticipantEndpoint) body: AddParticipantBody,
  ): Promise<PriceChange> {
    return this.admin.previewParticipant(registrationId, body);
  }

  @Endpoint(addParticipantEndpoint)
  public addParticipant(
    @RequestActor() actor: Actor,
    @EndpointParams(addParticipantEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(addParticipantEndpoint) body: SaveAddParticipantBody,
  ): Promise<RegistrationDetail> {
    return this.admin.addParticipant(actor, registrationId, body);
  }

  @Endpoint(moveRegistrationEndpoint)
  public move(
    @RequestActor() actor: Actor,
    @EndpointParams(moveRegistrationEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(moveRegistrationEndpoint) { turnusId }: MoveRegistrationBody,
  ): Promise<RegistrationDetail> {
    return this.admin.move(actor, registrationId, turnusId);
  }

  @Endpoint(editGuardianEndpoint)
  public editGuardian(
    @RequestActor() actor: Actor,
    @EndpointParams(editGuardianEndpoint) { registrationId, position }: AdminGuardianParams,
    @EndpointBody(editGuardianEndpoint) body: EditGuardianBody,
  ): Promise<RegistrationDetail> {
    return this.admin.editGuardian(actor, registrationId, position, body);
  }
}
