import { Controller, UseGuards } from '@nestjs/common';

import {
  getRegistrationFormEndpoint,
  getRegistrationFormVersionEndpoint,
  publishRegistrationFormEndpoint,
  saveRegistrationFormDraftEndpoint,
  uploadDeclarationFileEndpoint,
  type CampParams,
  type RegistrationForm,
  type RegistrationFormVersion,
  type RegistrationFormVersionParams,
  type SaveRegistrationFormDraftBody,
  type UploadedDeclarationFile,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { RegistrationFormService } from './services/registration-form.service.ts';

@Access('admin')
@Controller()
export class RegistrationFormController {
  constructor(private readonly forms: RegistrationFormService) {}

  @Endpoint(getRegistrationFormEndpoint)
  @Requires('campSettings', 'read')
  public get(@EndpointParams(getRegistrationFormEndpoint) { campId }: CampParams): Promise<RegistrationForm> {
    return this.forms.get(campId);
  }

  @Endpoint(saveRegistrationFormDraftEndpoint)
  @Requires('campSettings', 'write')
  public saveDraft(
    @RequestActor() actor: Actor,
    @EndpointParams(saveRegistrationFormDraftEndpoint) { campId }: CampParams,
    @EndpointBody(saveRegistrationFormDraftEndpoint) body: SaveRegistrationFormDraftBody,
  ): Promise<RegistrationForm> {
    return this.forms.saveDraft(actor, campId, body);
  }

  @Endpoint(publishRegistrationFormEndpoint)
  @Requires('campSettings', 'write')
  public publish(
    @RequestActor() actor: Actor,
    @EndpointParams(publishRegistrationFormEndpoint) { campId }: CampParams,
  ): Promise<RegistrationFormVersion> {
    return this.forms.publish(actor, campId);
  }

  @Endpoint(getRegistrationFormVersionEndpoint)
  @Requires('campSettings', 'read')
  public getVersion(
    @EndpointParams(getRegistrationFormVersionEndpoint) { campId, version }: RegistrationFormVersionParams,
  ): Promise<RegistrationFormVersion> {
    return this.forms.getVersion(campId, version);
  }

  @Endpoint(uploadDeclarationFileEndpoint)
  @Requires('campSettings', 'write')
  @UseGuards(FileUploadGuard)
  public uploadFile(
    @RequestActor() actor: Actor,
    @EndpointParams(uploadDeclarationFileEndpoint) { campId }: CampParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<UploadedDeclarationFile> {
    return this.forms.uploadFile(actor, campId, upload);
  }
}
