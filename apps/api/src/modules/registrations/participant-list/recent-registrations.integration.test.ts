import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  OPEN_TURNUS,
  organisationHost,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const GUARDIAN = {
  guardianFirstName: 'Jana',
  guardianLastName: 'Testovací',
  guardianEmail: 'jana.testovaci@example.com',
  guardianPhone: '+420 123 456 789',
};

describe('recent Registrations and where they came from', () => {
  const { app, http, clock, database, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let turnusId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const recent = (headers = owner) => http().get('/api/registrations/recent').set(headers);
  const bodyOf = (firstName: string, extra: object = {}) => ({
    idempotencyKey: randomUUID(),
    turnusId,
    submission: {
      registration: GUARDIAN,
      participants: [{ firstName, lastName: 'Testovací', birthDate: '2016-05-01' }],
    },
    paymentChoice: 'full',
    discountCode: null,
    declarations: [],
    ...extra,
  });
  // As a guardian on the public form, which says it came from an admin.
  const submitPublicly = async (firstName: string) =>
    (
      await http()
        .post('/api/public-camps/letni-tabor/registrations')
        .set({
          Host: await organisationHost(app(), organisationId),
          'x-csrf-protection': '1',
          'X-Forwarded-For': '198.51.100.23',
        })
        .send(bodyOf(firstName, { source: 'admin' }))
    ).body.id as string;
  // As an admin, who says it came from the public form.
  const createAsAdmin = async (firstName: string) =>
    (
      await http()
        .post(`/api/camps/${campId}/registrations`)
        .set(owner)
        .send(bodyOf(firstName, { sendConfirmation: false, source: 'public' }))
    ).body.id as string;
  const at = (time: string) => clock().set(new Date(`2027-04-10T${time}:00Z`));

  beforeEach(async () => {
    at('08:00');
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    turnusId = (await http().post(`/api/camps/${campId}/turnusy`).set(owner).send(OPEN_TURNUS)).body.id;
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({ definition: { standard: [], custom: [] }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  });

  it('records a public submission as public and an admin one as admin, whatever the request says', async () => {
    const online = await submitPublicly('Ema');
    at('08:30');
    const entered = await createAsAdmin('Jan');

    expect((await http().get(`/api/registrations/${online}`).set(owner)).body.source).toBe('public');
    expect((await http().get(`/api/registrations/${entered}`).set(owner)).body.source).toBe('admin');
    expect(
      ((await recent()).body as { id: string; source: string }[]).map(({ id, source }) => ({ id, source })),
    ).toEqual([
      { id: entered, source: 'admin' },
      { id: online, source: 'public' },
    ]);
  });

  it('lists the newest across Turnusy and Camps, only what the overview shows, without Erased ones', async () => {
    const winterCamp = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const ids: string[] = [];

    for (const [index, firstName] of ['Adam', 'Bára', 'Cyril', 'Dana', 'Eva', 'Filip', 'Gustav'].entries()) {
      at(`0${index + 1}:00`);
      ids.push(
        (
          await submitRegistration(app(), organisationId, index % 2 === 0 ? campId : winterCamp, {
            children: [{ firstName, lastName: 'Testovací', birthDate: '2016-05-01' }],
          })
        ).id,
      );
    }
    at('09:00');
    await http()
      .post(`/api/registrations/${ids[6]}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 6500, paidOn: '2027-04-10', note: '' });
    await http().post(`/api/registrations/${ids[5]}/erase`).set(owner);

    const response = await recent();

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body.map(({ participants }: { participants: { firstName: string }[] }) => participants)).toEqual(
      ['Gustav', 'Eva', 'Dana', 'Cyril', 'Bára'].map((firstName) => [{ firstName, lastName: 'Testovací' }]),
    );
    expect(response.body[0]).toEqual({
      id: ids[6],
      submittedAt: '2027-04-10T07:00:00.000Z',
      source: 'public',
      turnus: { id: expect.any(String), name: 'Turnus 1' },
      camp: { id: campId, name: 'Letní tábor' },
      participants: [{ firstName: 'Gustav', lastName: 'Testovací' }],
      paymentStatus: 'paid',
    });
    expect(response.body[2]).toMatchObject({ camp: { id: winterCamp, name: 'Zimní tábor' }, paymentStatus: 'unpaid' });
  });

  it('takes Registrations read', async () => {
    await submitPublicly('Ema');

    await expectPermission(['registrations', 'read'], organisationId, (headers) => recent(headers));
  });

  it("never shows another Organisation's Registrations", async () => {
    await submitPublicly('Ema');
    const otherId = await createOrganisation(app());
    const otherCamp = await createCamp(app(), otherId, 'Zimní tábor', 'zimni-tabor');
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    const other = await submitRegistration(app(), otherId, otherCamp, {
      children: [{ firstName: 'Cizí', lastName: 'Testovací', birthDate: '2016-05-01' }],
    });

    expect(
      ((await recent()).body as { participants: { firstName: string }[] }[]).flatMap(({ participants }) =>
        participants.map(({ firstName }) => firstName),
      ),
    ).toEqual(['Ema']);
    expect(((await recent(otherOwner)).body as { id: string }[]).map(({ id }) => id)).toEqual([other.id]);
  });

  it('fills the source of existing Registrations from how each was created', async () => {
    const online = await submitPublicly('Ema');
    at('08:30');
    const entered = await createAsAdmin('Jan');
    const [backfill] = readdirSync(new URL('../../../../drizzle/', import.meta.url)).filter((name) =>
      name.endsWith('_backfill-registration-source'),
    );
    const sql = readFileSync(new URL(`../../../../drizzle/${backfill}/migration.sql`, import.meta.url), 'utf8');

    await query('ALTER TABLE registrations ALTER COLUMN source DROP NOT NULL');
    await query('UPDATE registrations SET source = NULL');
    await query(sql);

    expect(await query('SELECT id, source FROM registrations ORDER BY submitted_at, id')).toEqual([
      { id: online, source: 'public' },
      { id: entered, source: 'admin' },
    ]);
  });
});
