import { Controller, UseInterceptors } from '@nestjs/common';

import {
  getCampBrandingEndpoint,
  removeCampLogoEndpoint,
  setCampLogoEndpoint,
  updateCampBrandingEndpoint,
  type CampBranding,
  type CampBrandingParams,
  type UpdateCampBrandingBody,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadInterceptor, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CampBrandingService } from './services/camp-branding.service.ts';

@Access('admin')
@Controller()
export class CampBrandingController {
  constructor(private readonly branding: CampBrandingService) {}

  @Endpoint(getCampBrandingEndpoint)
  @Requires('campSettings', 'read')
  public get(@EndpointParams(getCampBrandingEndpoint) { campId }: CampBrandingParams): Promise<CampBranding> {
    return this.branding.get(campId);
  }

  @Endpoint(updateCampBrandingEndpoint)
  @Requires('campSettings', 'write')
  public update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateCampBrandingEndpoint) { campId }: CampBrandingParams,
    @EndpointBody(updateCampBrandingEndpoint) body: UpdateCampBrandingBody,
  ): Promise<CampBranding> {
    return this.branding.update(actor, campId, body);
  }

  @Endpoint(setCampLogoEndpoint)
  @Requires('campSettings', 'write')
  @UseInterceptors(FileUploadInterceptor)
  public setLogo(
    @RequestActor() actor: Actor,
    @EndpointParams(setCampLogoEndpoint) { campId }: CampBrandingParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<CampBranding> {
    return this.branding.setLogo(actor, campId, upload);
  }

  @Endpoint(removeCampLogoEndpoint)
  @Requires('campSettings', 'write')
  public removeLogo(
    @RequestActor() actor: Actor,
    @EndpointParams(removeCampLogoEndpoint) { campId }: CampBrandingParams,
  ): Promise<CampBranding> {
    return this.branding.removeLogo(actor, campId);
  }
}
