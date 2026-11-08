import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  signIn,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { housekeepingJob } from '../../housekeeping/housekeeping.jobs.ts';

const SHIRT = '0190a2b4-0000-7000-8000-0000000000a7';
const DIET = '0190a2b4-0000-7000-8000-0000000000a8';

describe('participant export', () => {
  const { app, http, clock, database, jobs, files, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const publish = async (custom: object[]) => {
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({ definition: { standard: [], custom }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  };
  const exportSheet = async (body: object = {}, path = `/api/turnusy/${turnusId}/exports`) => {
    const started = await http().post(path).set(owner).send(body);
    expect(started.body).toMatchObject({ status: 'pending', file: null });
    await jobs().drain();
    const ready = await http().get(`/api/exports/${started.body.id}`).set(owner);
    expect(ready.body.status).toBe('ready');
    const file = await http()
      .get(ready.body.file.url)
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(file.body as Buffer).buffer);
    const sheet = workbook.worksheets[0];
    const rows: unknown[][] = [];
    sheet?.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));

    return rows;
  };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await publish([
      {
        id: SHIRT,
        type: 'short_text',
        label: 'Tričko',
        hint: null,
        required: false,
        scope: 'participant',
        health: false,
      },
      {
        id: DIET,
        type: 'single_choice',
        label: 'Strava',
        hint: null,
        required: false,
        scope: 'participant',
        health: false,
        options: [{ id: 'veg', label: 'Vegetariánská', surcharge: null, needsVerification: false }],
      },
    ]);
    const { id } = await submitRegistration(app(), organisationId, campId, {
      children: [{ firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01', [SHIRT]: 'M', [DIET]: 'veg' }],
    });
    turnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [id]))[0]?.turnus_id ??
      '';
  });

  it('exports one row per Participant with the columns of every form version, removed ones marked', async () => {
    await publish([
      {
        id: SHIRT,
        type: 'short_text',
        label: 'Velikost trička',
        hint: null,
        required: false,
        scope: 'participant',
        health: false,
      },
    ]);

    const [headers, row] = await exportSheet();

    expect(headers).toEqual(
      expect.arrayContaining([
        'Příjmení',
        'Jméno',
        'Variabilní symbol',
        'Velikost trička',
        'Strava (odstraněno)',
        'Stav platby',
      ]),
    );
    expect(row?.[headers?.indexOf('Příjmení') ?? -1]).toBe('Testovací');
    expect(row?.[headers?.indexOf('Velikost trička') ?? -1]).toBe('M');
    expect(row?.[headers?.indexOf('Strava (odstraněno)') ?? -1]).toBe('Vegetariánská');
    expect(row?.[headers?.indexOf('Celkem') ?? -1]).toBe(6500);
    expect(row?.[headers?.indexOf('Stav platby') ?? -1]).toBe('Nezaplaceno');
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'export.create'`)).toHaveLength(1);
  });

  it('shows an export only to the admin who started it, and a repeated start waits for it', async () => {
    const started = await http().post(`/api/turnusy/${turnusId}/exports`).set(owner);
    const again = await http().post(`/api/turnusy/${turnusId}/exports`).set(owner);
    expect(again.body.id).toBe(started.body.id);
    const colleague = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);

    expect((await http().get(`/api/exports/${started.body.id}`).set(colleague)).status).toBe(404);
  });

  it('takes Registrations read, and keeps another Organisation away', async () => {
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().post(`/api/turnusy/${turnusId}/exports`).set(headers),
    );
    await expectIsolated(() => http().post(`/api/turnusy/${turnusId}/exports`).set(asOther));
  });

  it('exports only the columns chosen and remembers the choice for the admin', async () => {
    const [headers] = await exportSheet({ columns: ['lastName', `field:${SHIRT}`, 'paid'] });

    expect(headers).toEqual(['Příjmení', 'Tričko', 'Zaplaceno']);
    expect((await http().get(`/api/turnusy/${turnusId}/export-options`).set(owner)).body).toMatchObject({
      formColumns: [
        { id: `field:${SHIRT}`, label: 'Tričko', removed: false },
        { id: `field:${DIET}`, label: 'Strava', removed: false },
      ],
      lastSelection: ['lastName', `field:${SHIRT}`, 'paid'],
    });
  });

  it('shares a preset with the Organisation for its Camp only', async () => {
    const colleague = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const otherCamp = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const otherTurnus = (await submitRegistration(app(), organisationId, otherCamp)).id;
    const otherTurnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [otherTurnus]))[0]
        ?.turnus_id ?? '';

    await http()
      .post(`/api/camps/${campId}/export-presets`)
      .set(owner)
      .send({ name: 'Autobus', columns: ['lastName', 'firstName', 'guardianPhone'] });

    expect((await http().get(`/api/turnusy/${turnusId}/export-options`).set(colleague)).body).toMatchObject({
      presets: [{ name: 'Autobus', columns: ['lastName', 'firstName', 'guardianPhone'] }],
      lastSelection: null,
    });
    expect((await http().get(`/api/turnusy/${otherTurnusId}/export-options`).set(colleague)).body.presets).toEqual([]);
  });

  it('exports the whole payment ledger with corrections and card payments for the accountant', async () => {
    const [registration] = await query<{ id: string; variable_symbol: string }>(
      'SELECT id, variable_symbol FROM registrations',
    );
    const pay = (body: object) =>
      http()
        .post(`/api/registrations/${registration?.id}/payments`)
        .set(owner)
        .send({ paidOn: '2027-04-12', note: 'Převodem', ...body });
    await pay({ kind: 'payment', amount: 3000 });
    await pay({ kind: 'correction', amount: 500, note: 'Vratka' });
    await query(
      `INSERT INTO payments (organisation_id, registration_id, source, amount, paid_on, note, recorded_at, gateway_transaction_id)
       VALUES ($1, $2, 'gateway', 1000, '2027-04-13', 'Platba kartou', now(), 'AB12-CD34-EF56')`,
      [organisationId, registration?.id],
    );

    const [headers, ...rows] = await exportSheet({}, '/api/payment-exports');

    expect(headers).toEqual([
      'Variabilní symbol',
      'Datum',
      'Částka',
      'Druh',
      'Poznámka',
      'Transakce platební brány',
      'Zapsáno',
    ]);
    expect(rows.map((row) => row.slice(0, 6))).toEqual([
      [registration?.variable_symbol, '12. 4. 2027', 3000, 'Platba', 'Převodem', undefined],
      [registration?.variable_symbol, '12. 4. 2027', -500, 'Oprava', 'Vratka', undefined],
      [registration?.variable_symbol, '13. 4. 2027', 1000, 'Platba kartou', 'Platba kartou', 'AB12-CD34-EF56'],
    ]);
  });

  it('exports the payments of the current Prague year by default, or of the dates asked, audited', async () => {
    const [registration] = await query<{ id: string; variable_symbol: string }>(
      'SELECT id, variable_symbol FROM registrations',
    );
    for (const paidOn of ['2026-12-31', '2027-01-01', '2027-04-12']) {
      await http()
        .post(`/api/registrations/${registration?.id}/payments`)
        .set(owner)
        .send({ kind: 'payment', amount: 100, paidOn, note: '' });
    }
    // 23:30 UTC on 31 December 2026 is already 2027 in Prague.
    clock().set(new Date('2026-12-31T23:30:00Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const dates = (rows: unknown[][]) => rows.slice(1).map((row) => row[1]);

    expect(dates(await exportSheet({}, '/api/payment-exports'))).toEqual(['1. 1. 2027', '12. 4. 2027']);
    expect(dates(await exportSheet({ from: '2026-12-01', to: '2027-01-01' }, '/api/payment-exports'))).toEqual([
      '31. 12. 2026',
      '1. 1. 2027',
    ]);
    expect(
      await query(
        `SELECT changes->'paidFrom'->>'new' AS paid_from, changes->'paidTo'->>'new' AS paid_to FROM audit_entries
         WHERE action = 'export.create' ORDER BY id`,
      ),
    ).toEqual([
      { paid_from: '2027-01-01', paid_to: '2027-12-31' },
      { paid_from: '2026-12-01', paid_to: '2027-01-01' },
    ]);
  });

  it('refuses reversed or half-given payment dates', async () => {
    const start = (body: object) => http().post('/api/payment-exports').set(owner).send(body);

    expect((await start({ from: '2027-05-01', to: '2027-04-30' })).status).toBe(400);
    expect((await start({ from: '2027-05-01' })).status).toBe(400);
    expect((await start({ from: '2027-02-30', to: '2027-03-01' })).status).toBe(400);
    expect(await query('SELECT FROM participant_exports')).toEqual([]);
  });

  it('expires an export a day after it started and removes its file, from the housekeeping', async () => {
    await exportSheet();
    const [started] = await query<{ id: string; file_id: string; admin_id: string }>(
      'SELECT id, file_id, admin_id FROM participant_exports',
    );
    const stored = () => [...files().objects.keys()].filter((key) => key.endsWith(started?.file_id ?? '-'));
    // The admin's session ended meanwhile; they signed in again.
    const shown = async () =>
      (
        await http()
          .get(`/api/exports/${started?.id}`)
          .set({ ...owner, Cookie: (await signIn(app(), started?.admin_id ?? '')).Cookie })
      ).body;

    clock().advance(24 * 60 * 60 * 1000);
    await jobs().due(housekeepingJob);
    await jobs().drain();
    expect(await shown()).toMatchObject({ status: 'ready' });
    expect(stored()).toHaveLength(1);

    clock().advance(1);
    await jobs().due(housekeepingJob);
    await jobs().drain();

    expect(await shown()).toEqual({
      id: started?.id,
      status: 'expired',
      file: null,
    });
    expect(await query(`SELECT FROM files WHERE content_type LIKE '%spreadsheet%'`)).toEqual([]);
    expect(stored()).toEqual([]);
  });
});
