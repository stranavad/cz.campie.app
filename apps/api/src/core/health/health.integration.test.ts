import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { setupApp } from '../../app.setup.ts';

// Nothing listens on port 1, so every connection is refused at once instead of waiting for a timeout.
const UNREACHABLE = '127.0.0.1:1';

describe('health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', `postgres://campie:campie@${UNREACHABLE}/campie`);
    vi.stubEnv('REDIS_URL', `redis://${UNREACHABLE}`);
    vi.stubEnv('S3_ENDPOINT', `http://${UNREACHABLE}`);
    vi.stubEnv('GOTENBERG_URL', `http://${UNREACHABLE}`);

    // The config is read when AppModule is first imported, so the import has to follow the stubs.
    const { AppModule } = await import('../../app.module.ts');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(moduleRef.createNestApplication({ logger: false }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('reports every unreachable service as down with 503', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      services: { database: 'down', redis: 'down', fileStorage: 'down', pdfRenderer: 'down' },
    });
  });
});
