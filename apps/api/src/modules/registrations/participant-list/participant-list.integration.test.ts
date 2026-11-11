import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  FAKE_INVOICE_REQUEST,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const RETURNING = '0190a2b4-0000-7000-8000-0000000000c1';

describe('participant list', () => {
  const { app, http, clock, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let turnusId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const list = (search: Record<string, string> = {}, headers = owner, id = turnusId) =>
    http().get(`/api/turnusy/${id}/participants`).query(search).set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: {
          standard: [],
          custom: [
            {
              id: RETURNING,
              type: 'yes_no',
              label: 'Byl už u nás',
              hint: null,
              required: false,
              scope: 'participant',
              health: false,
              surcharge: -500,
              needsVerification: true,
            },
          ],
        },
        maxParticipants: 3,
        declarations: [],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
    const { id } = await submitRegistration(app(), organisationId, campId, {
      children: [
        { firstName: 'Žofie', lastName: 'Šťastná', birthDate: '2016-05-01' },
        { firstName: 'Adam', lastName: 'Chalupa', birthDate: '2018-09-12' },
        { firstName: 'Ida', lastName: 'Hrubá', birthDate: '2017-03-03' },
      ],
    });
    turnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [id]))[0]?.turnus_id ??
      '';
  });

  it("lists the Turnus's Participants by surname in Czech order with age, guardian, symbol and money", async () => {
    const response = await list();

    expect(response.status).toBe(200);
    expect(response.body.map(({ lastName }: { lastName: string }) => lastName)).toEqual([
      'Hrubá',
      'Chalupa',
      'Šťastná',
    ]);
    expect(response.body[1]).toMatchObject({
      firstName: 'Adam',
      lastName: 'Chalupa',
      ageOnStart: 8,
      guardianName: 'Jana Testovací',
      guardianEmail: 'jana.testovaci@example.com',
      variableSymbol: expect.stringMatching(/^27\d{6}$/),
      paymentStatus: 'unpaid',
      amountDue: { amount: 19_500, dueDate: '2027-04-24' },
      overdue: false,
      status: 'registered',
      unverifiedClaimedDiscount: false,
    });
  });

  it('searches child and guardian names, email and Variable symbol in any case and without diacritics', async () => {
    const [{ variableSymbol }] = (await list()).body as { variableSymbol: string }[];
    const names = async (search: string) =>
      ((await list({ search })).body as { firstName: string }[]).map(({ firstName }) => firstName);

    expect(await names('stastna')).toEqual(['Žofie']);
    expect(await names('ŠŤASTNÁ  žofie')).toEqual(['Žofie']);
    expect(await names('jana testovaci')).toEqual(['Ida', 'Adam', 'Žofie']);
    expect(await names('JANA.TESTOVACI@')).toEqual(['Ida', 'Adam', 'Žofie']);
    expect(await names(`chalupa ${variableSymbol.slice(2)}`)).toEqual(['Adam']);
    expect(await names('nikdo')).toEqual([]);
  });

  it('filters by payment status and by an unverified Claimed discount', async () => {
    const other = await submitRegistration(app(), organisationId, campId, {
      children: [{ firstName: 'Petr', lastName: 'Vrátný', birthDate: '2015-01-01', [RETURNING]: true }],
    });
    const otherTurnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [other.id]))[0]
        ?.turnus_id ?? '';
    await http()
      .post(`/api/registrations/${other.id}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 6000, paidOn: '2027-04-10', note: '' });

    const names = async (search: Record<string, string>, id = turnusId) =>
      ((await list(search, owner, id)).body as { firstName: string }[]).map(({ firstName }) => firstName);

    expect(await names({ paymentStatus: 'paid' }, otherTurnusId)).toEqual(['Petr']);
    expect(await names({ paymentStatus: 'paid' })).toEqual([]);
    expect(await names({ paymentStatus: 'unpaid' })).toEqual(['Ida', 'Adam', 'Žofie']);
    expect(await names({ unverifiedClaimedDiscount: 'true' }, otherTurnusId)).toEqual(['Petr']);
    expect(await names({ unverifiedClaimedDiscount: 'true' })).toEqual([]);
  });

  it('filters by whether a Registration has an Invoice request and whether it is invoiced', async () => {
    const other = await submitRegistration(app(), organisationId, campId, {
      children: [{ firstName: 'Petr', lastName: 'Vrátný', birthDate: '2015-01-01' }],
    });
    const otherTurnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [other.id]))[0]
        ?.turnus_id ?? '';
    await http()
      .put(`/api/registrations/${other.id}/invoice-request`)
      .set(owner)
      .send({ ...FAKE_INVOICE_REQUEST, invoicedOn: null, invoiceNumber: null });

    const names = async (search: Record<string, string>, id = turnusId) =>
      ((await list(search, owner, id)).body as { firstName: string }[]).map(({ firstName }) => firstName);

    expect(await names({ invoice: 'none' })).toEqual(['Ida', 'Adam', 'Žofie']);
    expect(await names({ invoice: 'none' }, otherTurnusId)).toEqual([]);
    expect(await names({ invoice: 'to_invoice' }, otherTurnusId)).toEqual(['Petr']);
    expect(await names({ invoice: 'to_invoice' })).toEqual([]);
  });

  it('remembers the Selected Turnus per admin', async () => {
    const colleague = await createAdmin(app(), { memberOf: [organisationId], owner: true });

    expect((await http().get('/api/selected-turnus').set(owner)).body).toMatchObject({
      turnusId: null,
      turnusy: [{ id: turnusId, campName: 'Letní tábor', name: 'Turnus 1' }],
    });
    expect((await http().put('/api/selected-turnus').set(owner).send({ turnusId })).body.turnusId).toBe(turnusId);
    expect((await http().get('/api/selected-turnus').set(owner)).body.turnusId).toBe(turnusId);
    expect((await http().get('/api/selected-turnus').set(colleague.headers(organisationId))).body.turnusId).toBeNull();
  });

  it('remembers a choice per Organisation for an admin in two', async () => {
    const secondId = await createOrganisation(app());
    const admin = await createAdmin(app(), { memberOf: [organisationId, secondId], owner: true });
    const secondCamp = await createCamp(app(), secondId, 'Zimní tábor', 'zimni-tabor');
    const secondRegistration = await submitRegistration(app(), secondId, secondCamp);
    const secondTurnus =
      (
        await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [secondRegistration.id])
      )[0]?.turnus_id ?? '';

    await http().put('/api/selected-turnus').set(admin.headers(organisationId)).send({ turnusId });
    await http().put('/api/selected-turnus').set(admin.headers(secondId)).send({ turnusId: secondTurnus });

    expect((await http().get('/api/selected-turnus').set(admin.headers(organisationId))).body.turnusId).toBe(turnusId);
    expect((await http().get('/api/selected-turnus').set(admin.headers(secondId))).body.turnusId).toBe(secondTurnus);
  });

  it('takes Registrations read', async () => {
    await expectPermission(['registrations', 'read'], organisationId, (headers) => list({}, headers));
    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get('/api/selected-turnus').set(headers),
    );
  });

  it("keeps another Organisation's admins away from the Turnus", async () => {
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() => list({}, asOther));
    await expectIsolated(() => http().put('/api/selected-turnus').set(asOther).send({ turnusId }));
  });
});
