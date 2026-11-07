import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('fake logo')]);

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('camp branding', () => {
  const { app, http, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { accentColour: '#2b8a4e' });
    campId = await createCamp(app(), organisationId, 'Letní tábor Pokusník');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const branding = (headers: RequestHeaders, id = campId) => http().get(`/api/camps/${id}/branding`).set(headers);
  const update = (headers: RequestHeaders, body: object, id = campId) =>
    http().patch(`/api/camps/${id}/branding`).set(headers).send(body);
  const uploadLogo = (headers: RequestHeaders, id = campId) =>
    http().put(`/api/camps/${id}/branding/logo`).set(headers).attach('file', PNG, 'logo.png');

  it("shows the Organisation's branding for a Camp without its own", async () => {
    await http()
      .put('/api/organisation-settings/logo')
      .set(owner.headers(organisationId))
      .attach('file', PNG, 'logo.png');

    const response = await branding(owner.headers(organisationId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accentColour: null,
      logo: null,
      effective: { accentColour: '#2b8a4e', logo: { url: expect.stringMatching(/^\/api\/downloads\//) } },
    });
  });

  it("shows a Camp's own colour and logo over its Organisation's, and its Organisation's again once cleared", async () => {
    await update(owner.headers(organisationId), { accentColour: '#E63946' });
    const withLogo = await uploadLogo(owner.headers(organisationId));

    expect(withLogo.body).toMatchObject({
      accentColour: '#e63946',
      logo: { url: expect.any(String) },
      effective: { accentColour: '#e63946', logo: { url: expect.any(String) } },
    });

    const [camp] = await query<{ logo_file_id: string }>('SELECT logo_file_id FROM camps WHERE id = $1', [campId]);
    const served = await http()
      .get(`/api/logos/${camp?.logo_file_id}`)
      .set({ Host: await organisationHost(app(), organisationId) })
      .buffer(true);
    expect(served.body).toEqual(PNG);

    await update(owner.headers(organisationId), { accentColour: null });
    const cleared = await http().delete(`/api/camps/${campId}/branding/logo`).set(owner.headers(organisationId));

    expect(cleared.body).toMatchObject({
      accentColour: null,
      logo: null,
      effective: { accentColour: '#2b8a4e', logo: null },
    });
    expect(await query('SELECT id FROM files')).toEqual([]);
  });

  it('audits every change with old and new values', async () => {
    await update(owner.headers(organisationId), { accentColour: '#e63946' });

    expect(
      await query('SELECT actor_identity, action, target_id, changes FROM audit_entries WHERE action = $1', [
        'camp.update',
      ]),
    ).toEqual([
      {
        actor_identity: owner.id,
        action: 'camp.update',
        target_id: campId,
        changes: { accentColour: { old: null, new: '#e63946' } },
      },
    ]);
  });

  it('takes Camp settings read to see and write to change', async () => {
    await expectPermission(['campSettings', 'read'], organisationId, (headers) => branding(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      update(headers, { accentColour: '#e63946' }),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => uploadLogo(headers));
  });

  it("keeps another Organisation's admins away from the Camp, even by its id", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await expectIsolated(() => branding(otherOwner.headers(otherId)));
    await expectIsolated(() => update(otherOwner.headers(otherId), { accentColour: '#e63946' }));
    await expectIsolated(() => uploadLogo(otherOwner.headers(otherId)));
    await expectIsolated(() => http().delete(`/api/camps/${campId}/branding/logo`).set(otherOwner.headers(otherId)));
  });
});
