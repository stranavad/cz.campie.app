import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, createOrganisation, mainHost } from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';

describe('account', () => {
  const { app, http } = useTestApp();

  it("lists only the signed-in admin's own memberships, with each Organisation's status", async () => {
    const organisationA = await createOrganisation(app(), {
      subdomain: 'tabor-a',
      displayName: 'Tábor A',
      status: 'pending',
    });
    const organisationB = await createOrganisation(app(), { subdomain: 'tabor-b', status: 'pending' });
    const admin = await createAdmin(app(), { memberOf: [organisationA] });
    await createAdmin(app(), { memberOf: [organisationB] });
    const { [ACCESS_HEADERS.organisation]: _, ...headers } = admin.headers(organisationA);

    const response = await http().get('/api/account').set(headers);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      email: expect.stringMatching(/@example\.com$/),
      operator: false,
      totpEnabled: false,
      secondFactor: false,
      memberships: [
        {
          owner: false,
          permissions: { registrations: 'none', campSettings: 'none', health: 'none', oddily: 'none', vedouci: 'none' },
          organisation: { id: organisationA, displayName: 'Tábor A', subdomain: 'tabor-a', status: 'pending' },
          support: null,
        },
      ],
    });
  });

  it('answers 401 without a session', async () => {
    expect((await http().get('/api/account').set('Host', mainHost(app()))).status).toBe(401);
  });
});
