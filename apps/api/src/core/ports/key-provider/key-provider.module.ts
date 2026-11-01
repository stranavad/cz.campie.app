import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { FixedKeyProvider } from './fixed-key-provider.adapter.ts';
import { KeyProvider } from './key-provider.port.ts';
import { SecretKeyProvider } from './secret-key-provider.adapter.ts';

@Global()
@Module({
  providers: [
    {
      provide: KeyProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): KeyProvider => {
        const keyProvider = config.get('keyProvider', { infer: true });

        return keyProvider.adapter === 'secret' ? new SecretKeyProvider(keyProvider.masterKey) : new FixedKeyProvider();
      },
    },
  ],
  exports: [KeyProvider],
})
export class KeyProviderModule {}
