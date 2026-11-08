import { Controller } from '@nestjs/common';

import type { CampParams } from '@repo/schema/camps';
import {
  addAccessEmailEndpoint,
  addParticipantEndpoint,
  cancelParticipantEndpoint,
  cancelRegistrationEndpoint,
  clearUndeliverableEndpoint,
  createRegistrationEndpoint,
  editAnswersEndpoint,
  editGuardianEndpoint,
  getTurnusFormEndpoint,
  moveRegistrationEndpoint,
  previewAddParticipantEndpoint,
  previewEditAnswersEndpoint,
  regeneratePrihlaskaEndpoint,
  removeAccessEmailEndpoint,
  removeGuardianEndpoint,
  type AccessEmailBody,
  type AccessEmailParams,
  type AddParticipantBody,
  type AdminGuardianParams,
  type ClearUndeliverableBody,
  type CreateRegistrationBody,
  type EditAnswersBody,
  type EditGuardianBody,
  type MoveRegistrationBody,
  type ParticipantParams,
  type PriceChange,
  type RegistrationDetail,
  type RegistrationParams,
  type SaveAddParticipantBody,
  type SaveEditAnswersBody,
  type SubmittedRegistration,
  type TurnusForm,
  type TurnusFormParams,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { adminAccessOf } from '../../../core/access/admin-access.ts';
import { Requires, type MemberAccess } from '../../../core/access/permission.ts';
import { RequestActor, RequestMember } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CancellationService } from '../cancellation/services/cancellation.service.ts';
import { RegistrationService } from '../registration/services/registration.service.ts';
import { AdminRegistrationService } from './services/admin-registration.service.ts';

@Access('admin')
@Requires('registrations', 'write')
@Controller()
export class AdminRegistrationController {
  constructor(
    private readonly registrations: RegistrationService,
    private readonly admin: AdminRegistrationService,
    private readonly cancellations: CancellationService,
  ) {}

  @Endpoint(cancelParticipantEndpoint)
  public cancelParticipant(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(cancelParticipantEndpoint) { registrationId, participantId }: ParticipantParams,
  ): Promise<RegistrationDetail> {
    return this.cancellations.cancelParticipant(adminAccessOf(actor, member), registrationId, participantId);
  }

  @Endpoint(cancelRegistrationEndpoint)
  public cancelAll(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(cancelRegistrationEndpoint) { registrationId }: RegistrationParams,
  ): Promise<RegistrationDetail> {
    return this.cancellations.cancelAll(adminAccessOf(actor, member), registrationId);
  }

  @Endpoint(addAccessEmailEndpoint)
  public addAccessEmail(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(addAccessEmailEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(addAccessEmailEndpoint) { email }: AccessEmailBody,
  ): Promise<RegistrationDetail> {
    return this.admin.addAccessEmail(adminAccessOf(actor, member), registrationId, email);
  }

  @Endpoint(clearUndeliverableEndpoint)
  public clearUndeliverable(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(clearUndeliverableEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(clearUndeliverableEndpoint) { email }: ClearUndeliverableBody,
  ): Promise<RegistrationDetail> {
    return this.admin.clearUndeliverable(adminAccessOf(actor, member), registrationId, email);
  }

  @Endpoint(removeAccessEmailEndpoint)
  public removeAccessEmail(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(removeAccessEmailEndpoint) { registrationId, accessEmailId }: AccessEmailParams,
  ): Promise<RegistrationDetail> {
    return this.admin.removeAccessEmail(adminAccessOf(actor, member), registrationId, accessEmailId);
  }

  @Endpoint(removeGuardianEndpoint)
  public removeGuardian(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(removeGuardianEndpoint) { registrationId, position }: AdminGuardianParams,
  ): Promise<RegistrationDetail> {
    return this.admin.removeGuardian(adminAccessOf(actor, member), registrationId, position);
  }

  @Endpoint(regeneratePrihlaskaEndpoint)
  public regeneratePrihlaska(
    @RequestActor() actor: Actor,
    @EndpointParams(regeneratePrihlaskaEndpoint) { registrationId, participantId }: ParticipantParams,
  ): Promise<void> {
    return this.admin.regeneratePrihlaska(actor, registrationId, participantId);
  }

  @Endpoint(createRegistrationEndpoint)
  public create(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(createRegistrationEndpoint) { campId }: CampParams,
    @EndpointBody(createRegistrationEndpoint) body: CreateRegistrationBody,
  ): Promise<SubmittedRegistration> {
    return this.registrations.createByAdmin(adminAccessOf(actor, member), campId, body);
  }

  @Endpoint(getTurnusFormEndpoint)
  public formOf(@EndpointParams(getTurnusFormEndpoint) { turnusId }: TurnusFormParams): Promise<TurnusForm> {
    return this.admin.formOf(turnusId);
  }

  @Endpoint(previewEditAnswersEndpoint)
  public previewAnswers(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(previewEditAnswersEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(previewEditAnswersEndpoint) body: EditAnswersBody,
  ): Promise<PriceChange> {
    return this.admin.previewAnswers(adminAccessOf(actor, member), registrationId, body);
  }

  @Endpoint(editAnswersEndpoint)
  public editAnswers(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(editAnswersEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(editAnswersEndpoint) body: SaveEditAnswersBody,
  ): Promise<RegistrationDetail> {
    return this.admin.editAnswers(adminAccessOf(actor, member), registrationId, body);
  }

  @Endpoint(previewAddParticipantEndpoint)
  public previewParticipant(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(previewAddParticipantEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(previewAddParticipantEndpoint) body: AddParticipantBody,
  ): Promise<PriceChange> {
    return this.admin.previewParticipant(adminAccessOf(actor, member), registrationId, body);
  }

  @Endpoint(addParticipantEndpoint)
  public addParticipant(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(addParticipantEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(addParticipantEndpoint) body: SaveAddParticipantBody,
  ): Promise<RegistrationDetail> {
    return this.admin.addParticipant(adminAccessOf(actor, member), registrationId, body);
  }

  @Endpoint(moveRegistrationEndpoint)
  public move(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(moveRegistrationEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(moveRegistrationEndpoint) { turnusId }: MoveRegistrationBody,
  ): Promise<RegistrationDetail> {
    return this.admin.move(adminAccessOf(actor, member), registrationId, turnusId);
  }

  @Endpoint(editGuardianEndpoint)
  public editGuardian(
    @RequestActor() actor: Actor,
    @RequestMember() member: MemberAccess,
    @EndpointParams(editGuardianEndpoint) { registrationId, position }: AdminGuardianParams,
    @EndpointBody(editGuardianEndpoint) body: EditGuardianBody,
  ): Promise<RegistrationDetail> {
    return this.admin.editGuardian(adminAccessOf(actor, member), registrationId, position, body);
  }
}
