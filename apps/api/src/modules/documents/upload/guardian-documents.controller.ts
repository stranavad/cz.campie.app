import { Controller, UseInterceptors } from '@nestjs/common';

import {
  listGuardianDocumentsEndpoint,
  uploadDocumentEndpoint,
  type GuardianDocuments,
  type GuardianDocumentsParams,
  type UploadDocumentParams,
} from '@repo/schema/documents';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadInterceptor, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { GuardianDocumentService } from './services/guardian-document.service.ts';

@Access('guardian')
@Controller()
export class GuardianDocumentsController {
  constructor(private readonly documents: GuardianDocumentService) {}

  @Endpoint(listGuardianDocumentsEndpoint)
  public list(
    @RequestGuardianEmail() email: string,
    @EndpointParams(listGuardianDocumentsEndpoint) { registrationId }: GuardianDocumentsParams,
  ): Promise<GuardianDocuments> {
    return this.documents.list(email, registrationId);
  }

  @Endpoint(uploadDocumentEndpoint)
  @UseInterceptors(FileUploadInterceptor)
  public upload(
    @RequestActor() actor: Actor,
    @EndpointParams(uploadDocumentEndpoint) params: UploadDocumentParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<GuardianDocuments> {
    return this.documents.upload(actor, params, upload);
  }
}
