import { Global, Module } from '@nestjs/common';

import { DeleteStoredFileHandler } from './delete-stored-file.job.ts';
import { FileDownloadController } from './file-download.controller.ts';
import { FileService } from './file.service.ts';

@Global()
@Module({
  controllers: [FileDownloadController],
  providers: [FileService, DeleteStoredFileHandler],
  exports: [FileService],
})
export class FilesModule {}
