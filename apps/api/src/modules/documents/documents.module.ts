import { Module } from '@nestjs/common';

import { DocumentTypeController } from './document-type/document-type.controller.ts';
import { GuardianDocumentsController } from './document-type/guardian-documents.controller.ts';
import { DocumentTypeService } from './document-type/services/document-type.service.ts';

@Module({
  controllers: [DocumentTypeController, GuardianDocumentsController],
  providers: [DocumentTypeService],
  exports: [DocumentTypeService],
})
// Named apart from the core DocumentsModule, which renders generated documents.
export class CampDocumentsModule {}
