import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const RULES = '0190a2b4-0000-7000-8000-0000000000ae';
const CHILDREN = {
  paid: { firstName: 'Adam', lastName: 'Zaplacený', birthDate: '2016-05-01' },
  partly: { firstName: 'Bára', lastName: 'Částečná', birthDate: '2016-05-01' },
  overpaid: { firstName: 'Cyril', lastName: 'Přeplacený', birthDate: '2016-05-01' },
  cancelled: { firstName: 'Dana', lastName: 'Zrušená', birthDate: '2016-05-01' },
};

describe('Turnus overview and list filters', () => {
  const { app, http, clock, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let turnusId: string;
  const ids: Record<string, string> = {};

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const pay = (registrationId: string, amount: number) =>
    http()
      .post(`/api/registrations/${registrationId}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount, paidOn: '2027-04-10', note: 'Převodem' });
  const names = async (filters: Record<string, string>) =>
    (
      (await http().get(`/api/turnusy/${turnusId}/participants`).query(filters).set(owner)).body as {
        firstName: string;
      }[]
    ).map(({ firstName }) => firstName);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    turnusId = '';
    for (const [key, child] of Object.entries(CHILDREN)) {
      ids[key] = (
        await submitRegistration(app(), organisationId, campId, {
          children: [child],
          ...(turnusId === '' ? {} : { turnusId }),
        })
      ).id;
      turnusId ||=
        (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [ids[key]]))[0]
          ?.turnus_id ?? '';
    }
    await pay(ids.paid ?? '', 6500);
    await pay(ids.partly ?? '', 2000);
    await pay(ids.overpaid ?? '', 7000);
    await http().post(`/api/registrations/${ids.cancelled}/cancel`).set(owner);
  });

  it('sums places and money across paid, partly paid, overpaid and Cancelled Registrations', async () => {
    clock().set(new Date('2027-04-30T10:00:00Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);

    expect((await http().get(`/api/turnusy/${turnusId}/overview`).set(owner)).body).toMatchObject({
      registered: 3,
      expected: 26_000,
      received: 15_500,
      outstanding: 11_000,
      overpaid: 500,
      overdueRegistrations: 2,
    });
  });

  it('filters by Overdue, unsigned Consents and missing documents, never finding a Cancelled child', async () => {
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true, documents: true } });
    const consent = await http()
      .post(`/api/camps/${campId}/consents`)
      .set(owner)
      .send({
        title: 'Táborový řád',
        introduction: '',
        items: [{ id: RULES, kind: 'must_agree', text: 'Souhlasím.' }],
        withdrawable: false,
        fileId: null,
      });
    await http()
      .post(`/api/camps/${campId}/document-types`)
      .set(owner)
      .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] });
    const [paidChild] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      ids.paid,
    ]);
    const guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
    await http()
      .post(
        `/api/portal/registrations/${ids.paid}/participants/${paidChild?.id}/consents/${consent.body.id}/signatures`,
      )
      .set(guardian)
      .send({
        consentVersionId: consent.body.versions[0].id,
        answers: { [RULES]: true },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });

    expect(await names({ unsignedConsent: 'true' })).toEqual(['Bára', 'Cyril']);
    expect(await names({ missingDocument: 'true' })).toEqual(['Bára', 'Cyril', 'Adam']);
    expect(await names({ overdue: 'true' })).toEqual([]);
  });

  it('keeps another Organisation away from the overview, and takes Registrations read', async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get(`/api/turnusy/${turnusId}/overview`).set(headers),
    );
    await expectIsolated(() => http().get(`/api/turnusy/${turnusId}/overview`).set(otherOwner));
  });
});
