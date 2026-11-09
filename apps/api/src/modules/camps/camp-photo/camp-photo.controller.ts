import { Controller, UseGuards } from '@nestjs/common';

import {
  getCampPhotoEndpoint,
  removeCampPhotoEndpoint,
  setCampPhotoEndpoint,
  type CampPhoto,
  type CampPhotoParams,
} from '@repo/schema/camps';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { CampPhotoService } from './services/camp-photo.service.ts';

@Access('admin')
@Controller()
export class CampPhotoController {
  constructor(private readonly photos: CampPhotoService) {}

  @Endpoint(getCampPhotoEndpoint)
  @Requires('campSettings', 'read')
  public get(@EndpointParams(getCampPhotoEndpoint) { campId }: CampPhotoParams): Promise<CampPhoto> {
    return this.photos.get(campId);
  }

  @Endpoint(setCampPhotoEndpoint)
  @Requires('campSettings', 'write')
  @UseGuards(FileUploadGuard)
  public set(
    @RequestActor() actor: Actor,
    @EndpointParams(setCampPhotoEndpoint) { campId }: CampPhotoParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<CampPhoto> {
    return this.photos.set(actor, campId, upload);
  }

  @Endpoint(removeCampPhotoEndpoint)
  @Requires('campSettings', 'write')
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeCampPhotoEndpoint) { campId }: CampPhotoParams,
  ): Promise<CampPhoto> {
    return this.photos.remove(actor, campId);
  }
}
