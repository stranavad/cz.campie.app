import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { FileStorage } from './file-storage.port.ts';
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

        return fileStorage.adapter === 'tigris' ? new TigrisFileStorage(fileStorage) : new S3FileStorage(fileStorage);
      },
    },
  ],
  exports: [FileStorage],
})
export class FileStorageModule {}
