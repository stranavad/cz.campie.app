import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bootApp, restoreEnv } from '../../testing/boot-app.ts';

// Nothing listens on port 1, so every connection is refused at once instead of waiting for a timeout.
const UNREACHABLE = '127.0.0.1:1';

describe('health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootApp({
      DATABASE_URL: `postgres://campie:campie@${UNREACHABLE}/campie`,
      REDIS_URL: `redis://${UNREACHABLE}`,
      S3_ENDPOINT: `http://${UNREACHABLE}`,
      PDF_RENDERER_ADAPTER: 'gotenberg',
      GOTENBERG_URL: `http://${UNREACHABLE}`,
    });
  });

  afterAll(async () => {
    await app.close();
    restoreEnv();
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
