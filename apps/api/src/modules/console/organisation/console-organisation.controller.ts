import { Controller } from '@nestjs/common';

import {
  approveOrganisationEndpoint,
  listConsoleOrganisationsEndpoint,
  rejectOrganisationEndpoint,
  renameOrganisationSubdomainEndpoint,
  resetOwnerTotpEndpoint,
  suspendOrganisationEndpoint,
  type ConsoleOrganisation,
  type ConsoleOrganisationParams,
  type RenameOrganisationSubdomainBody,
  type ResetOwnerTotpBody,
} from '@repo/schema/console';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { TotpService } from '../../admins/totp/services/totp.service.ts';
import { ConsoleOrganisationService, type ConsoleOrganisationView } from './services/console-organisation.service.ts';

const toDto = ({ organisation, mail }: ConsoleOrganisationView): ConsoleOrganisation => organisation.toConsoleDto(mail);

@Access('operator')
@Controller()
export class ConsoleOrganisationController {
  constructor(
    private readonly organisations: ConsoleOrganisationService,
    private readonly totp: TotpService,
  ) {}

  @Endpoint(listConsoleOrganisationsEndpoint)
  public async list(): Promise<ConsoleOrganisation[]> {
    return (await this.organisations.list()).map(toDto);
  }

  @Endpoint(approveOrganisationEndpoint)
  public async approve(
    @RequestActor() actor: Actor,
    @EndpointParams(approveOrganisationEndpoint) { organisationId }: ConsoleOrganisationParams,
  ): Promise<ConsoleOrganisation> {
    return toDto(await this.organisations.approve(actor, organisationId));
  }

  @Endpoint(renameOrganisationSubdomainEndpoint)
  public async rename(
    @RequestActor() actor: Actor,
    @EndpointParams(renameOrganisationSubdomainEndpoint) { organisationId }: ConsoleOrganisationParams,
    @EndpointBody(renameOrganisationSubdomainEndpoint) { subdomain }: RenameOrganisationSubdomainBody,
  ): Promise<ConsoleOrganisation> {
    return toDto(await this.organisations.rename(actor, organisationId, subdomain));
  }

  @Endpoint(rejectOrganisationEndpoint)
  public reject(
    @RequestActor() actor: Actor,
    @EndpointParams(rejectOrganisationEndpoint) { organisationId }: ConsoleOrganisationParams,
  ): Promise<void> {
    return this.organisations.reject(actor, organisationId);
  }

  @Endpoint(suspendOrganisationEndpoint)
  public async suspend(
    @RequestActor() actor: Actor,
    @EndpointParams(suspendOrganisationEndpoint) { organisationId }: ConsoleOrganisationParams,
  ): Promise<ConsoleOrganisation> {
    return toDto(await this.organisations.suspend(actor, organisationId));
  }

  @Endpoint(resetOwnerTotpEndpoint)
  public resetOwnerTotp(
    @RequestActor() actor: Actor,
    @EndpointParams(resetOwnerTotpEndpoint) { organisationId }: ConsoleOrganisationParams,
    @EndpointBody(resetOwnerTotpEndpoint) { email }: ResetOwnerTotpBody,
  ): Promise<void> {
    return this.totp.resetOwner(actor, organisationId, email);
  }
}
