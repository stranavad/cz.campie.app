import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { FileStorage } from './file-storage.port.ts';
import { MemoryFileStorage } from './memory-file-storage.adapter.ts';
import { S3FileStorage } from './s3-file-storage.adapter.ts';
import { TigrisFileStorage } from './tigris-file-storage.adapter.ts';

@Global()
@Module({
  providers: [
    {
      provide: FileStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): FileStorage => {
        const fileStorage = config.get('fileStorage', { infer: true });

        switch (fileStorage.adapter) {
          case 'tigris':
            return new TigrisFileStorage(fileStorage);
          case 's3':
            return new S3FileStorage(fileStorage);
          case 'memory':
            return new MemoryFileStorage();
        }
      },
    },
  ],
  exports: [FileStorage],
})
export class FileStorageModule {}
