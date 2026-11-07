import { Controller } from '@nestjs/common';

import {
  listGuardianDocumentsEndpoint,
  type GuardianDocuments,
  type GuardianDocumentsParams,
} from '@repo/schema/documents';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestGuardianEmail } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { DocumentTypeService } from './services/document-type.service.ts';

@Access('guardian')
@Controller()
export class GuardianDocumentsController {
  constructor(private readonly types: DocumentTypeService) {}

  @Endpoint(listGuardianDocumentsEndpoint)
  public list(
    @RequestGuardianEmail() email: string,
    @EndpointParams(listGuardianDocumentsEndpoint) { registrationId }: GuardianDocumentsParams,
  ): Promise<GuardianDocuments> {
    return this.types.forGuardian(email, registrationId);
  }
}
