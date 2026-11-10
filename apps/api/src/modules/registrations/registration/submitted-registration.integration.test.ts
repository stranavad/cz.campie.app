import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  brandOrganisation,
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  FAKE_INVOICE_REQUEST,
  offerInvoiceRequests,
  OPEN_TURNUS,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const JANA = 'jana.testovaci@example.com';
const ACCOUNT = '19-2000145399/0800';
const WITH_DEPOSIT = { deposit: 2000, depositDueDays: 14, balanceDueDate: '2027-06-15' };

const useSubmitted = (env: Record<string, string> = {}) => {
  const testApp = useTestApp({ env });
  const { app, http, clock } = testApp;
  const state = {} as { organisationId: string; campId: string; owner: RequestHeaders; host: string };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    state.organisationId = await createOrganisation(app());
    state.campId = await createCamp(app(), state.organisationId, 'Letní tábor', 'letni-tabor');
    state.owner = (await createAdmin(app(), { memberOf: [state.organisationId], owner: true })).headers(
      state.organisationId,
    );
    state.host = await organisationHost(app(), state.organisationId);
    await http()
      .put(`/api/camps/${state.campId}/registration-form/draft`)
      .set(state.owner)
      .send({ definition: { standard: [], custom: [] }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${state.campId}/registration-form/versions`).set(state.owner);
  });

  const turnusOf = async (turnus: object): Promise<string> =>
    (
      await http()
        .post(`/api/camps/${state.campId}/turnusy`)
        .set(state.owner)
        .send({ ...OPEN_TURNUS, ...turnus })
    ).body.id;

  const send = (turnusId: string, paymentChoice: 'full' | 'deposit', idempotencyKey: string, extra: object = {}) => {
    return http()
      .post('/api/public-camps/letni-tabor/registrations')
      .set({ Host: state.host, 'x-csrf-protection': '1' })
      .send({
        idempotencyKey,
        turnusId,
        submission: {
          registration: {
            guardianFirstName: 'Jana',
            guardianLastName: 'Testovací',
            guardianEmail: JANA,
            guardianPhone: '+420 123 456 789',
          },
          participants: [
            { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' },
            { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' },
          ],
        },
        paymentChoice,
        discountCode: null,
        declarations: [],
        ...extra,
      });
  };

  const submit = async (
    turnus: object,
    paymentChoice: 'full' | 'deposit',
    idempotencyKey = randomUUID(),
    extra: object = {},
  ) => send(await turnusOf(turnus), paymentChoice, idempotencyKey, extra);

  const portalPayment = async (registrationId: string) =>
    (
      await http()
        .get(`/api/portal/registrations/${registrationId}`)
        .set((await createGuardianSession(app(), state.organisationId, JANA)).headers)
    ).body.payment;

  return { ...testApp, state, turnusOf, send, submit, portalPayment };
};

describe('payment details after a submission', () => {
  const { app, state, turnusOf, send, submit, portalPayment } = useSubmitted();

  it('gives the Deposit and the rest with their QR platby, as the portal shows them', async () => {
    await brandOrganisation(app(), state.organisationId, { bankAccount: ACCOUNT });

    const submitted = (await submit(WITH_DEPOSIT, 'deposit')).body;

    expect(submitted.payment).toMatchObject({
      account: ACCOUNT,
      phase: 'deposit',
      amount: 4000,
      dueDate: '2027-04-24',
      qrPlatba: expect.stringMatching(/\*AM:4000\.00\*.*\*DT:20270424\*/),
      balance: {
        amount: 9000,
        dueDate: '2027-06-15',
        outstanding: 13000,
        qrPlatba: expect.stringContaining('*AM:13000.00*'),
      },
    });
    expect(submitted.payment).toEqual(await portalPayment(submitted.id));
  });

  it('gives the whole price without a Deposit, as the portal shows it', async () => {
    await brandOrganisation(app(), state.organisationId, { bankAccount: ACCOUNT });

    const submitted = (await submit({}, 'full')).body;

    expect(submitted.payment).toMatchObject({
      account: ACCOUNT,
      phase: 'full',
      amount: 13000,
      qrPlatba: expect.stringContaining(`*AM:13000.00*`),
      balance: null,
    });
    expect(submitted.payment).toEqual(await portalPayment(submitted.id));
  });

  it('gives the same payment details again for a repeated submission with the same key', async () => {
    await brandOrganisation(app(), state.organisationId, { bankAccount: ACCOUNT });
    const key = randomUUID();
    const turnusId = await turnusOf(WITH_DEPOSIT);

    const first = (await send(turnusId, 'deposit', key)).body;
    const again = await send(turnusId, 'deposit', key);

    expect(again.status).toBe(201);
    expect(again.body.id).toBe(first.id);
    expect(again.body.payment).toEqual(first.payment);
    expect(again.body.payment.qrPlatba).toContain('*AM:4000.00*');
  });

  it('gives no account and no QR platba while the Organisation has no account, as the portal', async () => {
    const submitted = (await submit(WITH_DEPOSIT, 'deposit')).body;

    expect(submitted.payment).toMatchObject({ account: null, amount: 4000, qrPlatba: null });
    expect(submitted.payment.balance.qrPlatba).toBeNull();
    expect(submitted.payment).toEqual(await portalPayment(submitted.id));
  });
});

describe('Přihlášky after a submission', () => {
  const { app, http, clock, jobs, state, submit } = useSubmitted();

  const prihlasky = (idempotencyKey: string, host = state.host, slug = 'letni-tabor') =>
    http()
      .post(`/api/public-camps/${slug}/registrations/prihlasky`)
      .set({ Host: host, 'x-csrf-protection': '1' })
      .send({ idempotencyKey });

  it('answers null links until the job made the Přihlášky, then links that download them for a few minutes', async () => {
    const key = randomUUID();
    await submit({}, 'full', key);

    const before = await prihlasky(key);

    expect(before.status).toBe(200);
    expect(before.body).toEqual({
      participants: [
        { position: 0, prihlaska: null },
        { position: 1, prihlaska: null },
      ],
    });

    await jobs().drain();
    const after = (await prihlasky(key)).body;
    const link = after.participants[0].prihlaska;
    const download = await http().get(link.url).buffer(true);

    expect(after.participants[1].prihlaska.url).toMatch(/^\/api\/downloads\/[A-Za-z0-9_.-]+$/);
    expect(link.url).not.toContain(key);
    expect(download.status).toBe(200);
    expect(download.headers).toMatchObject({
      'content-type': 'application/pdf',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    });

    clock().advance(5 * 60 * 1000 + 1000);
    expect((await http().get(link.url)).status).toBe(404);
  });

  it('refuses a day after the submission, an unknown key, another Camp and an Erased Registration', async () => {
    const key = randomUUID();
    const registrationId = (await submit({}, 'full', key)).body.id;
    await createCamp(app(), state.organisationId, 'Zimní tábor', 'zimni-tabor');

    expect((await prihlasky(randomUUID())).status).toBe(404);
    expect((await prihlasky(key, state.host, 'zimni-tabor')).status).toBe(404);

    clock().set(new Date('2027-04-11T10:00:01Z'));
    expect((await prihlasky(key)).status).toBe(404);

    clock().set(new Date('2027-04-10T10:30:00Z'));
    expect((await prihlasky(key)).status).toBe(200);
    await http().post(`/api/registrations/${registrationId}/erase`).set(state.owner);
    expect((await prihlasky(key)).status).toBe(404);
  });

  it("keeps another Organisation's subdomain away from the key", async () => {
    const key = randomUUID();
    await submit({}, 'full', key);
    await jobs().drain();
    const organisationB = await createOrganisation(app());
    await createCamp(app(), organisationB, 'Letní tábor', 'letni-tabor');

    expect((await prihlasky(key, await organisationHost(app(), organisationB))).status).toBe(404);
  });
});

describe('Přihlášky after a submission, past the limit', () => {
  const { state, http, submit } = useSubmitted({ SUBMISSION_LIMIT_PER_IP: '2' });

  it('refuses an address past its limit with 429, counted apart from the submissions', async () => {
    const key = randomUUID();
    await submit({}, 'full', key);
    const prihlasky = () =>
      http()
        .post('/api/public-camps/letni-tabor/registrations/prihlasky')
        .set({ Host: state.host, 'x-csrf-protection': '1' })
        .send({ idempotencyKey: key });

    expect((await prihlasky()).status).toBe(200);
    expect((await prihlasky()).status).toBe(200);

    const refused = await prihlasky();

    expect(refused.status).toBe(429);
    expect(refused.body.code).toBe('requests_throttled');
  });
});

describe('an Invoice request at submission', () => {
  const { app, jobs, mail, state, submit: submitWith, portalPayment } = useSubmitted();
  const submit = (turnus: object, paymentChoice: 'full' | 'deposit', extra: object) =>
    submitWith(turnus, paymentChoice, randomUUID(), extra);

  // Two children at 6 500, so 13 000 in all.
  const INVOICE = { ...FAKE_INVOICE_REQUEST, postcode: '110 00', amount: 10_000 };

  const offerInvoices = () => offerInvoiceRequests(app(), state.organisationId, state.campId);

  it('is refused while the Camp does not offer it', async () => {
    const refused = await submit({}, 'full', { invoiceRequest: INVOICE });

    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual([{ path: ['invoiceRequest'], code: 'invoice_request_unavailable' }]);
  });

  it('is refused with field errors for a wrong IČO, a missing field, nothing to invoice or more than the total', async () => {
    await offerInvoices();

    const invalid = await submit({}, 'full', {
      invoiceRequest: { ...INVOICE, ico: '12345678', street: '', amount: 0 },
    });
    const tooMuch = await submit({}, 'full', { invoiceRequest: { ...INVOICE, amount: 13_001 } });

    expect(invalid.status).toBe(400);
    expect(invalid.body.fields).toEqual([
      { path: ['invoiceRequest', 'ico'], code: 'ico_invalid' },
      { path: ['invoiceRequest', 'street'], code: 'invoice_field_required' },
      { path: ['invoiceRequest', 'amount'], code: 'invoice_amount_zero' },
    ]);
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.fields).toEqual([
      { path: ['invoiceRequest', 'amount'], code: 'invoice_amount_above_total', params: { max: 13_000 } },
    ]);
  });

  it('asks the guardian for their share only, with the invoiced line, in the response, the portal and the email', async () => {
    await brandOrganisation(app(), state.organisationId, { bankAccount: ACCOUNT });
    await offerInvoices();

    const submitted = await submit(WITH_DEPOSIT, 'deposit', { invoiceRequest: INVOICE });

    expect(submitted.status).toBe(201);
    expect(submitted.body.payment).toMatchObject({
      phase: 'deposit',
      amount: 3000,
      qrPlatba: expect.stringContaining('*AM:3000.00*'),
      balance: null,
      invoiced: { companyName: 'Fiktivní firma s.r.o.', amount: 10_000 },
    });
    expect(submitted.body.payment).toEqual(await portalPayment(submitted.body.id));

    await jobs().drain();
    const confirmation = mail().sent.find(({ to }) => to.includes(JANA));

    expect(confirmation?.text).toMatch(/Záloha k úhradě: 3\s000\sKč/);
    expect(confirmation?.text).toMatch(/Fakturováno firmě Fiktivní firma s\.r\.o\.: 10\s000\sKč/);
  });

  it('gives no QR platba when the company pays everything', async () => {
    await brandOrganisation(app(), state.organisationId, { bankAccount: ACCOUNT });
    await offerInvoices();

    const submitted = await submit({}, 'full', { invoiceRequest: { ...INVOICE, amount: 13_000 } });

    expect(submitted.body.payment).toMatchObject({
      phase: 'settled',
      amount: 0,
      qrPlatba: null,
      invoiced: { amount: 13_000 },
    });
  });
});
