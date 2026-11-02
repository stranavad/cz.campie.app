import { Controller } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ACCESS_HEADERS, defineEndpoint, type EndpointBody as Body } from '@repo/schema/shared';

import { organisations } from '../../db/schema.ts';
import { createOrganisation, mainHost } from '../../testing/fixtures.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { Access } from '../access/access.decorator.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { Endpoint, EndpointBody } from './endpoint.decorator.ts';

const renameEndpoint = defineEndpoint({
  method: 'POST',
  path: '/test-endpoint/rename',
  body: z.object({ organisationId: z.uuid(), name: z.string().trim().min(1), leak: z.boolean().default(false) }),
  response: z.object({ name: z.string() }),
});

const pingEndpoint = defineEndpoint({ method: 'POST', path: '/test-endpoint/ping' });

// Stands in for a feature's controller: renames an Organisation and answers with what it holds.
@Access('platform')
@Controller()
class TestEndpointController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Endpoint(renameEndpoint)
  public async rename(
    @EndpointBody(renameEndpoint) { organisationId, name, leak }: Body<typeof renameEndpoint>,
  ): Promise<{ name: string }> {
    await this.unitOfWork.db
      .update(organisations)
      .set({ displayName: name })
      .where(eq(organisations.id, organisationId));

    // A key declared nowhere stands in for a field slipping out; a wrong shape for a server bug that the
    // type system was talked out of.
    const answer = { name, secret: organisationId };

    return leak ? ({ name: 1 } as unknown as { name: string }) : answer;
  }

  @Endpoint(pingEndpoint)
  public async ping(): Promise<void> {}

  // @ts-expect-error A route must return what its endpoint answers.
  @Endpoint(pingEndpoint)
  public async wrong(): Promise<string> {
    return 'not void';
  }
}

describe('endpoints', () => {
  const { app, http } = useTestApp({ controllers: [TestEndpointController] });

  const post = (path: string, body?: object) =>
    http()
      .post(`/api${path}`)
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send(body);

  const displayName = (id: string) =>
    app()
      .get(UnitOfWork)
      .runForPlatform(async () => {
        const rows = await app().get(UnitOfWork).db.select().from(organisations);

        return rows.find((row) => row.id === id)?.displayName;
      });

  it('hands the route its parsed body and answers only what the response schema declares', async () => {
    const organisationId = await createOrganisation(app(), { displayName: 'Před' });

    const response = await post('/test-endpoint/rename', { organisationId, name: '  Po  ', unknown: 1 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ name: 'Po' });
    expect(await displayName(organisationId)).toBe('Po');
  });

  it('rejects a body its schema refuses, before the route runs', async () => {
    const organisationId = await createOrganisation(app(), { displayName: 'Před' });

    const response = await post('/test-endpoint/rename', { organisationId, name: ' ' });

    expect(response.status).toBe(400);
    expect(await displayName(organisationId)).toBe('Před');
  });

  it('fails a response that does not match its schema as 500 and rolls the change back', async () => {
    const organisationId = await createOrganisation(app(), { displayName: 'Před' });

    const response = await post('/test-endpoint/rename', { organisationId, name: 'Po', leak: true });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ statusCode: 500, message: 'Internal server error' });
    expect(await displayName(organisationId)).toBe('Před');
  });

  it('answers 204 without a body for an endpoint without a response', async () => {
    const response = await post('/test-endpoint/ping');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });
});
