import type { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from './env.schema.ts';

// Loads and validates the configuration from the environment the app starts in.
export function appConfigModule(): Promise<DynamicModule> {
  const appEnv = process.env.APP_ENV ?? 'local';

  // Real env vars win over the file, so a deployment, Docker Compose or a test can override any value.
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: appEnv === 'test' ? '.env.test' : '.env',
    ignoreEnvFile: appEnv === 'production' || appEnv === 'staging',
    validationSchema: envSchema,
  });
}
