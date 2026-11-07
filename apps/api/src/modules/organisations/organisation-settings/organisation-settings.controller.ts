import { Controller, UseInterceptors } from '@nestjs/common';

import {
  getOrganisationSettingsEndpoint,
  removeOrganisationLogoEndpoint,
  requireTotpEndpoint,
  setOrganisationLogoEndpoint,
  updateOrganisationSettingsEndpoint,
  type OrganisationSettings,
  type RequireTotpBody,
  type UpdateOrganisationSettingsBody,
} from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadInterceptor, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import {
  OrganisationSettingsService,
  type OrganisationSettingsView,
} from './services/organisation-settings.service.ts';

const toDto = ({ organisation, logo }: OrganisationSettingsView): OrganisationSettings =>
  organisation.toSettingsDto(logo);

@Access('admin')
@Requires('owner')
@Controller()
export class OrganisationSettingsController {
  constructor(private readonly settings: OrganisationSettingsService) {}

  @Endpoint(getOrganisationSettingsEndpoint)
  public async get(): Promise<OrganisationSettings> {
    return toDto(await this.settings.get());
  }

  @Endpoint(updateOrganisationSettingsEndpoint)
  public async update(
    @RequestActor() actor: Actor,
    @EndpointBody(updateOrganisationSettingsEndpoint) body: UpdateOrganisationSettingsBody,
  ): Promise<OrganisationSettings> {
    return toDto(await this.settings.update(actor, body));
  }

  @Endpoint(requireTotpEndpoint)
  public async requireTotp(
    @RequestActor() actor: Actor,
    @EndpointBody(requireTotpEndpoint) { required }: RequireTotpBody,
  ): Promise<OrganisationSettings> {
    return toDto(await this.settings.requireTotp(actor, required));
  }

  @Endpoint(setOrganisationLogoEndpoint)
  @UseInterceptors(FileUploadInterceptor)
  public async setLogo(
    @RequestActor() actor: Actor,
    @UploadedFile() upload: FileUpload,
  ): Promise<OrganisationSettings> {
    return toDto(await this.settings.setLogo(actor, upload));
  }

  @Endpoint(removeOrganisationLogoEndpoint)
  public async removeLogo(@RequestActor() actor: Actor): Promise<OrganisationSettings> {
    return toDto(await this.settings.removeLogo(actor));
  }
}
