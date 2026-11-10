import { Controller, UseGuards } from '@nestjs/common';

import {
  removeInvoiceRequestEndpoint,
  saveInvoiceRequestEndpoint,
  uploadInvoiceFileEndpoint,
  type AdminInvoiceRequestBody,
  type InvoiceFile,
  type InvoiceRequest,
  type RegistrationParams,
} from '@repo/schema/registrations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { RequestActor } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { FileUploadGuard, UploadedFile, type FileUpload } from '../../../core/files/file-upload.ts';
import { Endpoint, EndpointBody, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { InvoiceRequestService } from './services/invoice-request.service.ts';

@Access('admin')
@Requires('registrations', 'write')
@Controller()
export class InvoiceRequestController {
  constructor(private readonly invoiceRequests: InvoiceRequestService) {}

  @Endpoint(saveInvoiceRequestEndpoint)
  public save(
    @RequestActor() actor: Actor,
    @EndpointParams(saveInvoiceRequestEndpoint) { registrationId }: RegistrationParams,
    @EndpointBody(saveInvoiceRequestEndpoint) body: AdminInvoiceRequestBody,
  ): Promise<InvoiceRequest> {
    return this.invoiceRequests.save(actor, registrationId, body);
  }

  @Endpoint(removeInvoiceRequestEndpoint)
  public remove(
    @RequestActor() actor: Actor,
    @EndpointParams(removeInvoiceRequestEndpoint) { registrationId }: RegistrationParams,
  ): Promise<void> {
    return this.invoiceRequests.remove(actor, registrationId);
  }

  @Endpoint(uploadInvoiceFileEndpoint)
  @UseGuards(FileUploadGuard)
  public upload(
    @RequestActor() actor: Actor,
    @EndpointParams(uploadInvoiceFileEndpoint) { registrationId }: RegistrationParams,
    @UploadedFile() upload: FileUpload,
  ): Promise<InvoiceFile> {
    return this.invoiceRequests.upload(actor, registrationId, upload);
  }
}
