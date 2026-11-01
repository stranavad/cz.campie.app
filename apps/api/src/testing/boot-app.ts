import type { Server } from 'node:http';
import type { INestApplication, LoggerService, Provider, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';

import { AppModule } from '../app.module.ts';
import { setupApp } from '../app.setup.ts';

// Nothing listens on port 1, so a stray connection is refused at once instead of reaching anything.
const UNREACHABLE = 'http://127.0.0.1:1';

// A complete production configuration with dummy credentials. Booting it reaches no service.
export const PRODUCTION_ENV = {
  APP_ENV: 'production',
  PLATFORM_DOMAIN: 'campie.cz',
  DATABASE_ADAPTER: 'neon',
  DATABASE_URL: 'postgres://campie:campie@127.0.0.1:1/campie',
  REDIS_URL: 'redis://127.0.0.1:1',
  JOB_WORKER: 'auto',
  CLOCK_ADAPTER: 'system',
  MAIL_ADAPTER: 'resend',
  RESEND_API_KEY: 're_dummy',
  FILE_STORAGE_ADAPTER: 'tigris',
  TIGRIS_STORAGE_ENDPOINT: UNREACHABLE,
  TIGRIS_STORAGE_BUCKET: 'campie',
  TIGRIS_STORAGE_ACCESS_KEY_ID: 'dummy',
  TIGRIS_STORAGE_SECRET_ACCESS_KEY: 'dummy',
  PDF_RENDERER_ADAPTER: 'gotenberg',
  GOTENBERG_URL: UNREACHABLE,
  PAYMENT_GATEWAY_ADAPTER: 'comgate',
  KEY_PROVIDER_ADAPTER: 'secret',
  MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
} satisfies Record<string, string>;

const initialEnv = new Set(Object.keys(process.env));

export interface BootOptions {
  // Over the test configuration; undefined removes a variable.
  env?: Record<string, string | undefined>;
  // Receives everything the app logs; silent when omitted.
  logger?: LoggerService | false;
  // Test-only controllers mounted next to the app's own, for proving infrastructure without a real route.
  controllers?: Type[];
  // Test-only providers next to the app's own, such as job handlers.
  providers?: Provider[];
}

// Boots the real AppModule as main.ts does.
export async function bootApp({
  env = {},
  logger = false,
  controllers = [],
  providers = [],
}: BootOptions = {}): Promise<INestApplication<Server>> {
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value);
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot()],
    controllers,
    providers,
  }).compile();
  const app = setupApp(moduleRef.createNestApplication<INestApplication<Server>>({ logger }));
  await app.init();

  return app;
}

// Undoes bootApp's variables, including those the config loader copied into process.env.
export function restoreEnv(): void {
  vi.unstubAllEnvs();

  for (const name of Object.keys(process.env)) {
    if (!initialEnv.has(name)) {
      delete process.env[name];
    }
  }
}
