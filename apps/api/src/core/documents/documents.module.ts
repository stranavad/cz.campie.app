import { Global, Module } from '@nestjs/common';

import { DocumentService } from './document.service.ts';

@Global()
@Module({
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentsModule {}
