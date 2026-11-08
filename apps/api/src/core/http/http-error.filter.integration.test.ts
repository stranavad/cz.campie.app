import { ConflictException, Controller, Get, NotFoundException, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { errorResponseSchema } from '@repo/schema/shared';

import { bootApp, restoreEnv } from '../../testing/boot-app.ts';
import { Access } from '../access/access.decorator.ts';

@Access('unscoped')
@Controller('errors')
class ThrowingController {
  @Get('internal')
  public internal(): never {
    throw new Error('connection to db-internal.example failed for rodne_cislo');
  }

  @Get('not-found')
  public notFound(): never {
    throw new NotFoundException();
  }

  @Get('conflict')
  public conflict(): never {
    throw new ConflictException({ code: 'slug_taken', message: 'Slug is taken' });
  }
}

describe('HTTP errors', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await bootApp({ controllers: [ThrowingController] });
  });

  afterEach(async () => {
    await app.close();
    restoreEnv();
  });

  it('answers an unexpected error with a bare 500 that leaks nothing', async () => {
    const response = await request(app.getHttpServer()).get('/api/errors/internal');

    expect(response.status).toBe(500);
    expect(errorResponseSchema.strict().parse(response.body)).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  it('keeps the status of an HTTP exception', async () => {
    const response = await request(app.getHttpServer()).get('/api/errors/not-found');

    expect(response.status).toBe(404);
    expect(errorResponseSchema.strict().parse(response.body)).toEqual({ statusCode: 404, message: 'Not Found' });
  });

  it('passes on the stable code the frontend translates', async () => {
    const response = await request(app.getHttpServer()).get('/api/errors/conflict');

    expect(response.status).toBe(409);
    expect(errorResponseSchema.strict().parse(response.body)).toEqual({
      statusCode: 409,
      code: 'slug_taken',
      message: 'Slug is taken',
    });
  });
});
