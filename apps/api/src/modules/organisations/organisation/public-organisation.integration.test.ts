import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createOrganisation, organisationHost, type RequestHeaders } from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';

describe('public organisation', () => {
  const { app, http } = useTestApp();

  let organisationId: string;
  let owner: Awaited<ReturnType<typeof createAdmin>>;
  let host: RequestHeaders;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), {
      displayName: 'Tábor Pokusník',
      accentColour: '#1d3557',
      contactEmail: 'info@pokusnik.example.com',
      contactPhone: '+420 111 222 333',
      billingEmail: 'fakturace@pokusnik.example.com',
    });
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    host = { Host: await organisationHost(app(), organisationId) };
  });

  it('shows its branding and the contact from its settings, and nothing else', async () => {
    await http()
      .patch('/api/organisation-settings')
      .set(owner.headers(organisationId))
      .send({ contactEmail: 'dotazy@pokusnik.example.com', contactPhone: '+420 444 555 666' });

    const response = await http().get('/api/organisation').set(host);

    expect(response.status).toBe(200);
    // The exact keys: no billing address, legal identity, bank account or admin ever leaves this way.
    expect(response.body).toEqual({
      displayName: 'Tábor Pokusník',
      accentColour: '#1d3557',
      logoUrl: null,
      contactEmail: 'dotazy@pokusnik.example.com',
      contactPhone: '+420 444 555 666',
    });
    expect(JSON.stringify(response.body)).not.toContain(owner.email);
  });

  it("shows on each subdomain only its own Organisation's contact", async () => {
    const otherId = await createOrganisation(app(), { contactEmail: 'info@jiny.example.com' });

    const other = await http()
      .get('/api/organisation')
      .set({ Host: await organisationHost(app(), otherId) });

    expect(other.body).toMatchObject({ contactEmail: 'info@jiny.example.com' });
    expect((await http().get('/api/organisation').set(host)).body).toMatchObject({
      contactEmail: 'info@pokusnik.example.com',
    });
  });

  it('shows no contact of a suspended or pending Organisation', async () => {
    const suspendedId = await createOrganisation(app(), { status: 'suspended' });
    const pendingId = await createOrganisation(app(), { status: 'pending' });

    const suspended = await http()
      .get('/api/organisation')
      .set({ Host: await organisationHost(app(), suspendedId) });
    const pending = await http()
      .get('/api/organisation')
      .set({ Host: await organisationHost(app(), pendingId) });

    expect(suspended.status).toBe(403);
    expect(suspended.body).toMatchObject({ code: 'organisation_suspended' });
    expect(suspended.body).not.toHaveProperty('contactEmail');
    expect(pending.status).toBe(404);
    expect(pending.body).toMatchObject({ code: 'organisation_unknown' });
  });
});
