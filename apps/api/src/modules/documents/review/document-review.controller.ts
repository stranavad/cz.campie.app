import { Controller, UseGuards } from '@nestjs/common';

import {
  addInternalDocumentEndpoint,
  approveDocumentEndpoint,
  getRegistrationDocumentsEndpoint,
  markDocumentOnPaperEndpoint,
  removeInternalDocumentEndpoint,
  returnDocumentEndpoint,
  uploadDocumentOnBehalfEndpoint,
  type AdminUpload,
  type ChildParams,
  type ChildRequirementParams,
  type DocumentUploadParams,
  type InternalDocument,
  type InternalDocumentParams,
  type RegistrationDocuments,
  type RegistrationDocumentsParams,
  type ReturnDocumentBody,
} from '@repo/schema/documents';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { DocumentReviewService } from './services/document-review.service.ts';

@Access('admin')
@Controller()
export class DocumentReviewController {
  constructor(private readonly reviews: DocumentReviewService) {}

  @Endpoint(getRegistrationDocumentsEndpoint)
  @Requires('registrations', 'read')
  public ofRegistration(
    @EndpointParams(getRegistrationDocumentsEndpoint) { registrationId }: RegistrationDocumentsParams,
  ): Promise<RegistrationDocuments> {
    return this.reviews.ofRegistration(registrationId);
  }

  @Endpoint(approveDocumentEndpoint)
  @Requires('registrations', 'write')
  public approve(
    @RequestActor() actor: Actor,
    @EndpointParams(approveDocumentEndpoint) { uploadId }: DocumentUploadParams,
  ): Promise<AdminUpload> {
    return this.reviews.approve(actor, uploadId);
  }

  @Endpoint(returnDocumentEndpoint)
  @Requires('registrations', 'write')
  public returnUpload(
    @RequestActor() actor: Actor,
    @EndpointParams(returnDocumentEndpoint) { uploadId }: DocumentUploadParams,
    @EndpointBody(returnDocumentEndpoint) body: ReturnDocumentBody,
  ): Promise<AdminUpload> {
    return this.reviews.returnUpload(actor, uploadId, body);
  }

  @Endpoint(uploadDocumentOnBehalfEndpoint)
  @Requires('registrations', 'write')
  @UseGuards(FileUploadGuard)
  public uploadOnBehalf(
    @RequestActor() actor: Actor,
    @EndpointParams(uploadDocumentOnBehalfEndpoint) params: ChildRequirementParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<AdminUpload> {
    return this.reviews.uploadOnBehalf(actor, params, upload);
  }

  @Endpoint(markDocumentOnPaperEndpoint)
  @Requires('registrations', 'write')
  public markOnPaper(
    @RequestActor() actor: Actor,
    @EndpointParams(markDocumentOnPaperEndpoint) params: ChildRequirementParams,
  ): Promise<AdminUpload> {
    return this.reviews.markOnPaper(actor, params);
  }

  @Endpoint(addInternalDocumentEndpoint)
  @Requires('registrations', 'write')
  @UseGuards(FileUploadGuard)
  public addInternal(
    @RequestActor() actor: Actor,
    @EndpointParams(addInternalDocumentEndpoint) params: ChildParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<InternalDocument> {
    return this.reviews.addInternal(actor, params, upload);
  }

  @Endpoint(removeInternalDocumentEndpoint)
  @Requires('registrations', 'write')
  public removeInternal(
    @RequestActor() actor: Actor,
    @EndpointParams(removeInternalDocumentEndpoint) { internalDocumentId }: InternalDocumentParams,
  ): Promise<void> {
    return this.reviews.removeInternal(actor, internalDocumentId);
  }
}
