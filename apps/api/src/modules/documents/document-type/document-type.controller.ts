import { Controller, UseGuards } from '@nestjs/common';

import {
  createDocumentTypeEndpoint,
  listDocumentTypesEndpoint,
  removeDocumentTypeEndpoint,
  removeDocumentTypeFileEndpoint,
  setDocumentTypeFileEndpoint,
  updateDocumentTypeEndpoint,
  type CampDocumentTypesParams,
  type DocumentType,
  type DocumentTypeBody,
  type DocumentTypeParams,
} from '@repo/schema/documents';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { DocumentTypeService } from './services/document-type.service.ts';

@Access('admin')
@Controller()
export class DocumentTypeController {
  constructor(private readonly types: DocumentTypeService) {}

  @Endpoint(listDocumentTypesEndpoint)
  @Requires('campSettings', 'read')
  public list(@EndpointParams(listDocumentTypesEndpoint) { campId }: CampDocumentTypesParams): Promise<DocumentType[]> {
    return this.types.list(campId);
  }

  @Endpoint(createDocumentTypeEndpoint)
  @Requires('campSettings', 'write')
  public create(
    @RequestActor() actor: Actor,
    @EndpointParams(createDocumentTypeEndpoint) { campId }: CampDocumentTypesParams,
    @EndpointBody(createDocumentTypeEndpoint) body: DocumentTypeBody,
  ): Promise<DocumentType> {
    return this.types.create(actor, campId, body);
  }

  @Endpoint(updateDocumentTypeEndpoint)
  @Requires('campSettings', 'write')
  public update(
    @RequestActor() actor: Actor,
    @EndpointParams(updateDocumentTypeEndpoint) { campId, documentTypeId }: DocumentTypeParams,
    @EndpointBody(updateDocumentTypeEndpoint) body: DocumentTypeBody,
  ): Promise<DocumentType> {
    return this.types.update(actor, campId, documentTypeId, body);
  }

  @Endpoint(removeDocumentTypeEndpoint)
  @Requires('campSettings', 'write')
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeDocumentTypeEndpoint) { campId, documentTypeId }: DocumentTypeParams,
  ): Promise<void> {
    return this.types.remove(actor, campId, documentTypeId);
  }

  @Endpoint(setDocumentTypeFileEndpoint)
  @Requires('campSettings', 'write')
  @UseGuards(FileUploadGuard)
  public setFile(
    @RequestActor() actor: Actor,
    @EndpointParams(setDocumentTypeFileEndpoint) { campId, documentTypeId }: DocumentTypeParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<DocumentType> {
    return this.types.setFile(actor, campId, documentTypeId, upload);
  }

  @Endpoint(removeDocumentTypeFileEndpoint)
  @Requires('campSettings', 'write')
  public removeFile(
    @RequestActor() actor: Actor,
    @EndpointParams(removeDocumentTypeFileEndpoint) { campId, documentTypeId }: DocumentTypeParams,
  ): Promise<DocumentType> {
    return this.types.removeFile(actor, campId, documentTypeId);
  }
}
