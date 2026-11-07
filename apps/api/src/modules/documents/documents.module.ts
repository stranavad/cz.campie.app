import { Module } from '@nestjs/common';

import { DocumentTypeController } from './document-type/document-type.controller.ts';
import { DocumentTypeService } from './document-type/services/document-type.service.ts';
import { GuardianDocumentsController } from './upload/guardian-documents.controller.ts';
import { GuardianDocumentService } from './upload/services/guardian-document.service.ts';

@Module({
  controllers: [DocumentTypeController, GuardianDocumentsController],
  providers: [DocumentTypeService, GuardianDocumentService],
  exports: [DocumentTypeService],
})
// Named apart from the core DocumentsModule, which renders generated documents.
export class CampDocumentsModule {}
