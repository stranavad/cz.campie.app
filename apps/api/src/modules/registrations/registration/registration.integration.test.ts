import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ORGANISATION_HOST_TTL_MS } from '../../../core/access/organisation-host-cache.ts';
import { DiscountCodeRepository } from '../../../repositories/camps/discount-code/discount-code.repository.ts';
import { TurnusRepository } from '../../../repositories/camps/turnus/turnus.repository.ts';
import { RegistrationRepository } from '../../../repositories/registrations/registration/registration.repository.ts';
import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { VariableSymbols } from './services/variable-symbols.ts';

const TRANSPORT = '0190a2b4-0000-7000-8000-000000000002';
const RETURNING = '0190a2b4-0000-7000-8000-000000000008';
const RULES = '0190a2b4-0000-7000-8000-00000000d101';
const PHOTOS = '0190a2b4-0000-7000-8000-00000000d102';

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
      health: false,
      options: [{ id: 'bus', label: 'Autobusem', surcharge: 300, needsVerification: false }],
    },
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
};

const DECLARATIONS = [
  { id: RULES, text: 'Souhlasím s táborovým řádem.', mandatory: true, url: null, fileId: null },
  { id: PHOTOS, text: 'Souhlasím s fotografováním.', mandatory: false, url: null, fileId: null },
];

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
  earlyBirdPrice: null,
  earlyBirdLastDay: null,
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const GUARDIAN = {
  guardianFirstName: 'Jana',
  guardianLastName: 'Testovací',
  guardianEmail: 'Jana.Testovaci@example.com',
  guardianPhone: '+420 123 456 789',
};

const EMA = { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' };
const JAN = { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' };

type Answers = Record<string, string | boolean>;

const useSubmissions = (env: Record<string, string> = {}) => {
  const testApp = useTestApp({ env });
  const { app, http, clock } = testApp;
  const state = {} as { organisationId: string; campId: string; turnusId: string; owner: RequestHeaders; host: string };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    state.organisationId = await createOrganisation(app());
    state.campId = await createCamp(app(), state.organisationId, 'Letní tábor', 'letni-tabor');
    state.owner = (await createAdmin(app(), { memberOf: [state.organisationId], owner: true })).headers(
      state.organisationId,
    );
    state.host = await organisationHost(app(), state.organisationId);
    await http()
      .patch(`/api/camps/${state.campId}`)
      .set(state.owner)
      .send({ siblingDiscountAmount: 400, siblingDiscountAppliesTo: 'from_second_child' });
    state.turnusId = await addTurnus({});
    await http()
      .put(`/api/camps/${state.campId}/registration-form/draft`)
      .set(state.owner)
      .send({ definition: DEFINITION, maxParticipants: 3, declarations: DECLARATIONS });
    await http().post(`/api/camps/${state.campId}/registration-form/versions`).set(state.owner);
  });

  const addTurnus = async (change: object): Promise<string> =>
    (
      await http()
        .post(`/api/camps/${state.campId}/turnusy`)
        .set(state.owner)
        .send({ ...TURNUS, ...change })
    ).body.id;

  const bodyOf = (change: object = {}) => ({
    idempotencyKey: randomUUID(),
    turnusId: state.turnusId,
    submission: {
      registration: { ...GUARDIAN, [TRANSPORT]: 'bus' } as Answers,
      participants: [{ ...EMA, [RETURNING]: true }, JAN] as Answers[],
    },
    paymentChoice: 'full',
    discountCode: null,
    declarations: [
      { id: RULES, accepted: true },
      { id: PHOTOS, accepted: false },
    ],
    ...change,
  });

  const submit = (body: object = bodyOf(), host = state.host) =>
    http()
      .post('/api/public-camps/letni-tabor/registrations')
      .set({ Host: host, 'x-csrf-protection': '1', 'X-Forwarded-For': '198.51.100.23' })
      .send(body);

  return { ...testApp, state, addTurnus, bodyOf, submit };
};

/**
 * Make a meeting point: each arrival waits there until a second one comes or a moment passes, so two
 * simultaneous requests pass it together unless a lock taken before it serialises them.
 */
function meetingPoint(): () => Promise<void> {
  let arrived = 0;
  let release = () => {};
  const both = new Promise<void>((resolve) => {
    release = resolve;
  });

  return async () => {
    arrived += 1;

    if (arrived === 2) {
      release();
    }

    await Promise.race([both, sleep(300)]);
  };
}

describe('registration submission', () => {
  const { app, http, clock, database, jobs, mail, state, addTurnus, bodyOf, submit } = useSubmissions();

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const createCode = (body: object) =>
    http()
      .post(`/api/camps/${state.campId}/discount-codes`)
      .set(state.owner)
      .send({ code: 'LETO', kind: 'fixed', value: 1000, usageLimit: null, expiresOn: null, ...body });

  it('stores the Registration with its guardian, Participants, answers and the price the preview showed', async () => {
    const body = bodyOf({ paymentChoice: 'deposit' });
    const preview = await http()
      .post('/api/public-camps/letni-tabor/price-preview')
      .set({ Host: state.host, 'x-csrf-protection': '1' })
      .send({
        turnusId: body.turnusId,
        submission: {
          registration: { [TRANSPORT]: 'bus' },
          participants: [{ [RETURNING]: true }, {}],
        },
        paymentChoice: 'deposit',
        discountCode: null,
      });

    const response = await submit(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      variableSymbol: expect.stringMatching(/^27\d{6}$/),
      total: 12_700,
      depositTotal: 4000,
      payment: expect.objectContaining({ phase: 'deposit', amount: 4000 }),
    });
    expect(preview.body).toMatchObject({ total: 12_700, depositTotal: 4000 });

    const lines = await query<{ kind: string; label: string | null; amount: number; position: number | null }>(
      `SELECT l.kind, l.label, l.amount, p.position FROM price_lines l
       LEFT JOIN participants p ON p.id = l.participant_id ORDER BY l.position`,
    );
    expect(lines.map(({ position, ...line }) => ({ ...line, participant: position }))).toEqual(preview.body.lines);

    expect(
      await query('SELECT payment_choice, deposit_total, answers FROM registrations WHERE id = $1', [response.body.id]),
    ).toEqual([{ payment_choice: 'deposit', deposit_total: 4000, answers: { [TRANSPORT]: 'bus' } }]);
    expect(await query('SELECT position, first_name, last_name, email, phone FROM registration_guardians')).toEqual([
      {
        position: 1,
        first_name: 'Jana',
        last_name: 'Testovací',
        email: 'jana.testovaci@example.com',
        phone: '+420 123 456 789',
      },
    ]);
    expect(
      await query(
        `SELECT position, first_name, last_name, to_char(birth_date, 'YYYY-MM-DD') AS birth_date, status, answers
         FROM participants ORDER BY position`,
      ),
    ).toEqual([
      { position: 0, ...snake(EMA), status: 'registered', answers: { [RETURNING]: true } },
      { position: 1, ...snake(JAN), status: 'registered', answers: {} },
    ]);
  });

  it('stores a second guardian when the form names one', async () => {
    const body = bodyOf();
    body.submission.registration = {
      ...body.submission.registration,
      secondGuardianFirstName: 'Petr',
      secondGuardianLastName: 'Testovací',
      secondGuardianEmail: 'petr.testovaci@example.com',
    };

    expect((await submit(body)).status).toBe(201);
    expect(await query('SELECT position, email, phone FROM registration_guardians ORDER BY position')).toEqual([
      { position: 1, email: 'jana.testovaci@example.com', phone: '+420 123 456 789' },
      { position: 2, email: 'petr.testovaci@example.com', phone: null },
    ]);
  });

  it('records each declaration answer with its time and address, and refuses an unticked mandatory one', async () => {
    const refused = await submit(bodyOf({ declarations: [{ id: PHOTOS, accepted: true }] }));

    expect(refused.status).toBe(400);
    expect(refused.body).toMatchObject({
      code: 'submission_invalid',
      fields: [{ path: ['declarations', RULES], code: 'declaration_required' }],
    });

    expect((await submit()).status).toBe(201);
    expect(
      await query(
        'SELECT declaration_id, accepted, answered_at, host(ip_address) AS ip FROM declaration_answers ORDER BY declaration_id',
      ),
    ).toEqual([
      { declaration_id: RULES, accepted: true, answered_at: new Date('2027-04-10T10:00:00Z'), ip: '198.51.100.23' },
      { declaration_id: PHOTOS, accepted: false, answered_at: new Date('2027-04-10T10:00:00Z'), ip: '198.51.100.23' },
    ]);
  });

  it('refuses answers that do not fit the form with a reason per field, storing nothing', async () => {
    const before = await snapshot(database().ownerUrl);
    const body = bodyOf();
    body.submission.registration = { ...GUARDIAN, guardianEmail: 'neni-email', [TRANSPORT]: 'lod' };
    body.submission.participants = [{ ...EMA, firstName: '' }, JAN, JAN, JAN];

    const refused = await submit(body);

    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual([
      { path: ['registration', 'guardianEmail'], code: 'form_answer_invalid' },
      { path: ['registration', TRANSPORT], code: 'form_answer_invalid' },
      { path: ['participants', 0, 'firstName'], code: 'form_answer_required' },
      { path: ['participants'], code: 'participants_too_many', params: { max: 3 } },
    ]);
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('refuses a child outside the age limits at its birth date', async () => {
    const body = bodyOf();
    body.submission.participants = [EMA, { ...JAN, birthDate: '2021-01-01' }, { ...JAN, birthDate: '2011-07-04' }];

    expect((await submit(body)).body.fields).toEqual([
      { path: ['participants', 1, 'birthDate'], code: 'participant_too_young', params: { min: 7 } },
      { path: ['participants', 2, 'birthDate'], code: 'participant_too_old', params: { max: 15 } },
    ]);
  });

  it('takes Registrations from the opening instant in Prague until just before the closing one', async () => {
    const turnusId = await addTurnus({ opensAt: '2027-04-10T14:00', closesAt: '2027-04-20T18:00' });
    const attempt = async (instant: string) => {
      clock().set(new Date(instant));

      return submit(bodyOf({ turnusId }));
    };

    expect((await attempt('2027-04-10T11:59:59Z')).body).toMatchObject({ code: 'turnus_not_yet_open' });
    expect((await attempt('2027-04-10T12:00:00Z')).status).toBe(201);
    expect((await attempt('2027-04-20T15:59:59Z')).status).toBe(201);
    expect((await attempt('2027-04-20T16:00:00Z')).body).toMatchObject({ code: 'turnus_window_closed' });
  });

  it('refuses a Turnus closed by hand', async () => {
    const turnusId = await addTurnus({ closedManually: true });
    const refused = await submit(bodyOf({ turnusId }));

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'turnus_closed_manually' });
  });

  it('gives the last place to exactly one of two simultaneous submissions', async () => {
    const turnusId = await addTurnus({ capacity: 3 });
    expect((await submit(bodyOf({ turnusId }))).status).toBe(201);

    const one = bodyOf({ turnusId });
    one.submission.participants = [EMA];
    const other = bodyOf({ turnusId });
    other.submission.participants = [JAN];
    const turnusy = app().get(TurnusRepository);
    const lockById = turnusy.lockById.bind(turnusy);
    const meet = meetingPoint();
    vi.spyOn(turnusy, 'lockById').mockImplementation(async (id) => {
      const locked = await lockById(id);
      await meet();

      return locked;
    });
    const results = await Promise.all([submit(one), submit(other)]);

    expect(results.map(({ status }) => status).sort((a, b) => a - b)).toEqual([201, 409]);
    expect(results.find(({ status }) => status === 409)?.body).toMatchObject({ code: 'turnus_full' });
    expect(
      (await http().get(`/api/camps/${state.campId}/turnusy`).set(state.owner)).body.find(
        ({ id }: { id: string }) => id === turnusId,
      ),
    ).toMatchObject({ registered: 3, availability: 'full' });
  });

  it("refuses a submission with more children than the Turnus's places left", async () => {
    const turnusId = await addTurnus({ capacity: 3 });
    const one = bodyOf({ turnusId });
    one.submission.participants = [EMA];
    expect((await submit(one)).status).toBe(201);

    expect(
      (await submit(bodyOf({ turnusId, submission: { ...one.submission, participants: [EMA, JAN, JAN] } }))).body,
    ).toMatchObject({ code: 'turnus_full' });
  });

  it("gives a code's last use to exactly one of two simultaneous submissions, even to different Turnusy", async () => {
    await createCode({ usageLimit: 1 });
    const otherTurnusId = await addTurnus({ name: 'Turnus 2' });
    const codes = app().get(DiscountCodeRepository);
    const lockByCode = codes.lockByCode.bind(codes);
    const meet = meetingPoint();
    vi.spyOn(codes, 'lockByCode').mockImplementation(async (campId, text) => {
      const locked = await lockByCode(campId, text);
      await meet();

      return locked;
    });

    const results = await Promise.all([
      submit(bodyOf({ discountCode: 'leto' })),
      submit(bodyOf({ discountCode: 'LETO', turnusId: otherTurnusId })),
    ]);

    expect(results.map(({ status }) => status).sort((a, b) => a - b)).toEqual([201, 400]);
    expect(results.find(({ status }) => status === 201)?.body).toMatchObject({ total: 11_700 });
    expect(results.find(({ status }) => status === 400)?.body).toMatchObject({
      code: 'submission_invalid',
      fields: [{ path: ['discountCode'], code: 'discount_code_exhausted' }],
    });
    expect(await query('SELECT count(*)::int AS uses FROM discount_code_uses')).toEqual([{ uses: 1 }]);
  });

  it('refuses a code that expired since the preview, at the code field', async () => {
    await createCode({ expiresOn: '2027-04-09' });

    expect((await submit(bodyOf({ discountCode: 'LETO' }))).body).toMatchObject({
      fields: [{ path: ['discountCode'], code: 'discount_code_expired' }],
    });
  });

  it('returns the first Registration for the same idempotency key, creating nothing new', async () => {
    const body = bodyOf();
    const registrations = app().get(RegistrationRepository);
    const getByIdempotencyKey = registrations.getByIdempotencyKey.bind(registrations);
    const meet = meetingPoint();
    vi.spyOn(registrations, 'getByIdempotencyKey').mockImplementation(async (key) => {
      await meet();

      return getByIdempotencyKey(key);
    });
    const [first, simultaneous] = await Promise.all([submit(body), submit(body)]);
    const again = await submit(body);

    expect(first.status).toBe(201);
    expect(simultaneous.body).toEqual(first.body);
    expect(again.body).toEqual(first.body);
    expect(await query('SELECT count(*)::int AS registrations FROM registrations')).toEqual([{ registrations: 1 }]);
  });

  it('refuses an idempotency key that already placed children in another Turnus', async () => {
    const body = bodyOf();
    expect((await submit(body)).status).toBe(201);

    const refused = await submit({ ...body, turnusId: await addTurnus({ name: 'Turnus 2' }) });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'idempotency_key_reused' });
  });

  it('starts the Variable symbol with the Prague year of the submission', async () => {
    const turnusId = await addTurnus({ startDate: '2028-07-02', endDate: '2028-07-15', balanceDueDate: null });
    clock().set(new Date('2027-12-31T23:30:00Z'));

    expect((await submit(bodyOf({ turnusId }))).body.variableSymbol).toMatch(/^28\d{6}$/);
  });

  it('draws another Variable symbol when the first one is taken in the Organisation', async () => {
    const draw = vi
      .spyOn(app().get(VariableSymbols), 'draw')
      .mockReturnValueOnce('27000001')
      .mockReturnValueOnce('27000001')
      .mockReturnValueOnce('27000002');

    expect((await submit()).body.variableSymbol).toBe('27000001');
    expect((await submit()).body.variableSymbol).toBe('27000002');
    expect(draw).toHaveBeenCalledTimes(3);
  });

  it('keeps the stored price lines when the price list changes later', async () => {
    await submit();
    const before = await query('SELECT kind, label, amount FROM price_lines ORDER BY position');

    await http()
      .put(`/api/turnusy/${state.turnusId}`)
      .set(state.owner)
      .send({ ...TURNUS, basePrice: 9900 });

    expect(await query('SELECT kind, label, amount FROM price_lines ORDER BY position')).toEqual(before);
  });

  it('audits the submission with the guardian as actor, by email', async () => {
    const { body } = await submit();

    expect(
      await query(
        'SELECT actor_kind, actor_identity, host(ip_address) AS ip, action FROM audit_entries WHERE target_id = $1',
        [body.id],
      ),
    ).toEqual([
      {
        actor_kind: 'guardian',
        actor_identity: 'jana.testovaci@example.com',
        ip: '198.51.100.23',
        action: 'registration.submit',
      },
    ]);
  });

  it("tells the Camp's team from a job, after the response", async () => {
    await http()
      .patch(`/api/camps/${state.campId}`)
      .set(state.owner)
      .send({ notificationEmails: ['hlavni@tabor.example.com'] });

    const { body } = await submit();
    expect(mail().sent).toEqual([]);

    await jobs().drain();
    const toTeam = mail().sent.filter(({ to }) => to.includes('hlavni@tabor.example.com'));
    expect(toTeam).toMatchObject([{ subject: 'Nová přihláška na Turnus 1' }]);
    expect(toTeam[0]?.text).toContain(`Ema Testovací, Jan Testovací, variabilní symbol ${body.variableSymbol}`);
  });

  it("answers 404 for another Camp's Turnus and offline for a suspended Organisation", async () => {
    const otherCampId = await createCamp(app(), state.organisationId, 'Zimní tábor', 'zimni-tabor');
    const foreignTurnus = (await http().post(`/api/camps/${otherCampId}/turnusy`).set(state.owner).send(TURNUS)).body
      .id;
    expect((await submit(bodyOf({ turnusId: foreignTurnus }))).status).toBe(404);

    const pendingId = await createOrganisation(app(), { status: 'pending' });
    expect((await submit(bodyOf(), await organisationHost(app(), pendingId))).status).toBe(404);

    // Suspended past the app, as another API instance would: it shows once the subdomain's cache expires.
    await query("UPDATE organisations SET status = 'suspended' WHERE id = $1", [state.organisationId]);
    clock().advance(ORGANISATION_HOST_TTL_MS);
    const refused = await submit();
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'organisation_suspended' });
  });

  it("keeps another Organisation's subdomain away from the Camp", async () => {
    const foreignId = await createOrganisation(app());

    expect((await submit(bodyOf(), await organisationHost(app(), foreignId))).status).toBe(404);
  });
});

describe('registration submission limit per address', () => {
  const { submit } = useSubmissions({ SUBMISSION_LIMIT_PER_IP: '1' });

  it('refuses an address past its limit with 429', async () => {
    expect((await submit()).status).toBe(201);

    const refused = await submit();
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'requests_throttled' });
  });
});

describe('registration submission limit per Organisation', () => {
  const { submit, bodyOf } = useSubmissions({ SUBMISSION_LIMIT_PER_ORGANISATION: '1' });

  it('counts only submissions that check out, so nonsense cannot lock families out', async () => {
    const nonsense = bodyOf({ declarations: [] });

    expect((await submit(nonsense)).status).toBe(400);
    expect((await submit(nonsense)).status).toBe(400);
    expect((await submit()).status).toBe(201);
    expect((await submit()).status).toBe(429);
  });
});

/**
 * Name a child's core answers as their columns.
 * @param child the child's core answers
 */
function snake({ firstName, lastName, birthDate }: typeof EMA) {
  return { first_name: firstName, last_name: lastName, birth_date: birthDate };
}
