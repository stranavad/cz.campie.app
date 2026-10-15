import { ConfigModule } from '@nestjs/config';

import { envSchema } from './env.schema.ts';

const appEnv = process.env.APP_ENV ?? 'local';

// Real env vars win over the file, so a deployment, Docker Compose or a test can override any value.
export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: appEnv === 'test' ? '.env.test' : '.env',
  ignoreEnvFile: appEnv === 'production',
  validationSchema: envSchema,
});
