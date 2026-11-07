import { Controller, UseGuards } from '@nestjs/common';

import {
  createConsentEndpoint,
  getConsentEndpoint,
  listConsentsEndpoint,
  publishConsentEndpoint,
  uploadConsentFileEndpoint,
  type CampConsentsParams,
  type Consent,
  type ConsentContent,
  type ConsentParams,
  type ConsentSummary,
  type UploadedConsentFile,
} from '@repo/schema/consents';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ConsentService } from './services/consent.service.ts';

@Access('admin')
@Controller()
export class ConsentController {
  constructor(private readonly consents: ConsentService) {}

  @Endpoint(listConsentsEndpoint)
  @Requires('campSettings', 'read')
  public list(@EndpointParams(listConsentsEndpoint) { campId }: CampConsentsParams): Promise<ConsentSummary[]> {
    return this.consents.list(campId);
  }

  @Endpoint(getConsentEndpoint)
  @Requires('campSettings', 'read')
  public get(@EndpointParams(getConsentEndpoint) { campId, consentId }: ConsentParams): Promise<Consent> {
    return this.consents.get(campId, consentId);
  }

  @Endpoint(createConsentEndpoint)
  @Requires('campSettings', 'write')
  public create(
    @RequestActor() actor: Actor,
    @EndpointParams(createConsentEndpoint) { campId }: CampConsentsParams,
    @EndpointBody(createConsentEndpoint) content: ConsentContent,
  ): Promise<Consent> {
    return this.consents.create(actor, campId, content);
  }

  @Endpoint(publishConsentEndpoint)
  @Requires('campSettings', 'write')
  public publish(
    @RequestActor() actor: Actor,
    @EndpointParams(publishConsentEndpoint) { campId, consentId }: ConsentParams,
    @EndpointBody(publishConsentEndpoint) content: ConsentContent,
  ): Promise<Consent> {
    return this.consents.publish(actor, campId, consentId, content);
  }

  @Endpoint(uploadConsentFileEndpoint)
  @Requires('campSettings', 'write')
  @UseGuards(FileUploadGuard)
  public uploadFile(
    @RequestActor() actor: Actor,
    @EndpointParams(uploadConsentFileEndpoint) { campId }: CampConsentsParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<UploadedConsentFile> {
    return this.consents.uploadFile(actor, campId, upload);
  }
}
