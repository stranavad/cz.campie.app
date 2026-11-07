import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { DocumentTypeController } from './document-type/document-type.controller.ts';
import { DocumentTypeService } from './document-type/services/document-type.service.ts';
import { SendDocumentReturnedHandler } from './review/document-returned.handler.ts';
import { DocumentReviewController } from './review/document-review.controller.ts';
import { DocumentReviewService } from './review/services/document-review.service.ts';
import { GuardianDocumentsController } from './upload/guardian-documents.controller.ts';
import { GuardianDocumentService } from './upload/services/guardian-document.service.ts';

@Module({
  imports: [CampsModule],
  controllers: [DocumentTypeController, GuardianDocumentsController, DocumentReviewController],
  providers: [DocumentTypeService, GuardianDocumentService, DocumentReviewService, SendDocumentReturnedHandler],
  exports: [DocumentTypeService],
})
// Named apart from the core DocumentsModule, which renders generated documents.
export class CampDocumentsModule {}
