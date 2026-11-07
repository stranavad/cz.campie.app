import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  signIn,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const TRANSPORT = '0190a2b4-0000-7000-8000-000000000002';
const RETURNING = '0190a2b4-0000-7000-8000-000000000008';

const DEFINITION = {
  standard: [],
  custom: [
    {
      id: TRANSPORT,
      type: 'single_choice',
      label: 'Doprava',
      hint: null,
      required: false,
      scope: 'registration',
      options: [{ id: 'bus', label: 'Autobusem', surcharge: 300, needsVerification: false }],
    },
    {
      id: RETURNING,
      type: 'yes_no',
      label: 'Byl už u nás',
      hint: null,
      required: false,
      scope: 'participant',
      surcharge: -500,
      needsVerification: true,
    },
  ],
};

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Pokusov',
  capacity: 40,
  minAge: 7,
  maxAge: 15,
  opensAt: null,
  closesAt: null,
  closedManually: false,
  websiteUrl: '',
  basePrice: 6500,
  earlyBirdPrice: 5900,
  earlyBirdLastDay: '2027-03-31',
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const usePricing = (env: Record<string, string> = {}) => {
  const testApp = useTestApp({ env });
  const { app, http, clock } = testApp;
  const state = {} as {
    organisationId: string;
    campId: string;
    turnusId: string;
    owner: RequestHeaders;
    host: RequestHeaders;
  };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    state.organisationId = await createOrganisation(app());
    state.campId = await createCamp(app(), state.organisationId, 'Letní tábor', 'letni-tabor');
    const owner = await createAdmin(app(), { memberOf: [state.organisationId], owner: true });
    state.owner = owner.headers(state.organisationId);
    state.host = { Host: await organisationHost(app(), state.organisationId) };
    await http()
      .patch(`/api/camps/${state.campId}`)
      .set(state.owner)
      .send({ siblingDiscountAmount: 400, siblingDiscountAppliesTo: 'from_second_child' });
    state.turnusId = (await http().post(`/api/camps/${state.campId}/turnusy`).set(state.owner).send(TURNUS)).body.id;
    await http()
      .put(`/api/camps/${state.campId}/registration-form/draft`)
      .set(state.owner)
      .send({ definition: DEFINITION, maxParticipants: 4, declarations: [] });
    await http().post(`/api/camps/${state.campId}/registration-form/versions`).set(state.owner);
  });

  const preview = (body: object = {}, slug = 'letni-tabor', host = state.host) =>
    http()
      .post(`/api/public-camps/${slug}/price-preview`)
      .set({ ...host, 'x-csrf-protection': '1' })
      .send({
        turnusId: state.turnusId,
        submission: { registration: { [TRANSPORT]: 'bus' }, participants: [{ [RETURNING]: true }, {}] },
        paymentChoice: 'full',
        discountCode: null,
        ...body,
      });

  return { ...testApp, state, preview };
};

describe('price preview', () => {
  const { app, http, clock, database, state, preview } = usePricing();

  const createCode = async (body: object) =>
    (
      await http()
        .post(`/api/camps/${state.campId}/discount-codes`)
        .set({ ...state.owner, ...(await signIn(app(), (await adminOf()).id)) })
        .send({ code: 'LETO', kind: 'fixed', value: 1000, usageLimit: null, expiresOn: null, ...body })
    ).body as { id: string };
  const adminOf = async () =>
    (
      await withClient(database().ownerUrl, (client) =>
        client.query<{ id: string }>('SELECT admin_id AS id FROM memberships WHERE organisation_id = $1', [
          state.organisationId,
        ]),
      )
    ).rows[0] ?? { id: '' };

  it('prices the answers as the pricing module does, without a session', async () => {
    const response = await preview();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      lines: [
        { kind: 'base_price', participant: 0, label: null, amount: 6500 },
        { kind: 'base_price', participant: 1, label: null, amount: 6500 },
        { kind: 'paid_extra', participant: 0, label: 'Doprava: Autobusem', amount: 300 },
        { kind: 'claimed_discount', participant: 0, label: 'Byl už u nás', amount: -500 },
        { kind: 'paid_extra', participant: 1, label: 'Doprava: Autobusem', amount: 300 },
        { kind: 'sibling_discount', participant: 1, label: null, amount: -400 },
      ],
      total: 12_700,
      depositAvailable: true,
      depositTotal: null,
      discountCode: null,
    });
  });

  it('applies the Early bird price through its last day in Prague', async () => {
    clock().set(new Date('2027-03-31T21:59:59Z'));

    expect((await preview()).body.lines[0]).toMatchObject({ kind: 'early_bird_price', amount: 5900 });
  });

  it('owes the Deposits when chosen, and offers no Deposit after the balance due date', async () => {
    expect((await preview({ paymentChoice: 'deposit' })).body).toMatchObject({
      depositAvailable: true,
      depositTotal: 4000,
    });

    clock().set(new Date('2027-06-16T10:00:00Z'));
    expect((await preview({ paymentChoice: 'deposit' })).body).toMatchObject({
      depositAvailable: false,
      depositTotal: null,
    });
  });

  it('applies a valid code in any case, and reports why another does not apply', async () => {
    const { id } = await createCode({});

    const applied = await preview({ discountCode: 'leto' });
    expect(applied.body).toMatchObject({ total: 11_700, discountCode: 'applied' });

    expect((await preview({ discountCode: 'ZIMA' })).body).toMatchObject({ total: 12_700, discountCode: 'unknown' });

    await http().patch(`/api/discount-codes/${id}`).set(state.owner).send({ active: false });
    expect((await preview({ discountCode: 'LETO' })).body).toMatchObject({ total: 12_700, discountCode: 'inactive' });
  });

  it('reports a code expired after its last day, and exhausted at its limit', async () => {
    await createCode({ code: 'STARY', expiresOn: '2027-04-09' });
    await createCode({ code: 'POSLEDNI', usageLimit: 1 });
    await submitRegistration(app(), state.organisationId, state.campId, { discountCode: 'POSLEDNI' });

    expect((await preview({ discountCode: 'STARY' })).body.discountCode).toBe('expired');
    expect((await preview({ discountCode: 'POSLEDNI' })).body.discountCode).toBe('exhausted');
  });

  it("answers 404 for another Camp's Turnus, a Camp without a published form, and another Organisation's Camp", async () => {
    const otherCampId = await createCamp(app(), state.organisationId, 'Zimní tábor', 'zimni-tabor');
    const otherTurnus = (await http().post(`/api/camps/${otherCampId}/turnusy`).set(state.owner).send(TURNUS)).body.id;

    expect((await preview({ turnusId: otherTurnus })).status).toBe(404);
    expect((await preview({}, 'zimni-tabor')).status).toBe(404);

    const foreignId = await createOrganisation(app());
    expect((await preview({}, 'letni-tabor', { Host: await organisationHost(app(), foreignId) })).status).toBe(404);
  });

  it("shows the Camp's contact on its public page, its Organisation's where it has none", async () => {
    const camp = (await http().get('/api/public-camps/letni-tabor').set(state.host)).body;

    expect(camp).toMatchObject({ contactName: null, contactEmail: expect.stringMatching(/^kontakt-/) });

    await http()
      .patch(`/api/camps/${state.campId}`)
      .set(state.owner)
      .send({ contactName: 'Jana Testovací', contactEmail: 'leto@tabor.example.com', contactPhone: '' });

    expect((await http().get('/api/public-camps/letni-tabor').set(state.host)).body).toMatchObject({
      contactName: 'Jana Testovací',
      contactEmail: 'leto@tabor.example.com',
      contactPhone: null,
    });
  });
});

describe('price preview limits', () => {
  const { preview } = usePricing({ PRICE_PREVIEW_LIMIT_PER_IP: '2' });

  it('refuses an address past its limit with 429', async () => {
    expect((await preview()).status).toBe(200);
    expect((await preview()).status).toBe(200);

    const refused = await preview();
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'requests_throttled' });
  });
});
