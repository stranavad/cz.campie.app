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

const RULES = '0190a2b4-0000-7000-8000-0000000000ef';
const PDF = Buffer.from('%PDF-1.7 zkušební potvrzení');

describe('erasing a Registration', () => {
  const { app, http, clock, database, jobs, files, expectPermission } = useTestApp();

  let organisationId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let registrationId: string;
  let variableSymbol: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const erase = (headers = owner) => http().post(`/api/registrations/${registrationId}/erase`).set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
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
    const requirement = await http()
      .post(`/api/camps/${campId}/document-types`)
      .set(owner)
      .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] });
    ({ id: registrationId, variableSymbol } = await submitRegistration(app(), organisationId, campId, {
      secondGuardian: true,
    }));
    const [participant] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      registrationId,
    ]);
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
    const childPath = `/api/portal/registrations/${registrationId}/participants/${participant?.id}`;
    await http()
      .post(`${childPath}/consents/${consent.body.id}/signatures`)
      .set(guardian)
      .send({
        consentVersionId: consent.body.versions[0].id,
        answers: { [RULES]: true },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });
    await http()
      .post(`${childPath}/documents/${requirement.body.id}`)
      .set(guardian)
      .attach('file', PDF, 'potvrzeni.pdf');
    await http()
      .post(`/api/registrations/${registrationId}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 2000, paidOn: '2027-04-10', note: 'Převodem' });
    await http()
      .post(`/api/registrations/${registrationId}/price-adjustments`)
      .set(owner)
      .send({ amount: -500, note: 'Sleva pro Emu Testovací' });
    await jobs().drain();
  });

  it('deletes every file and all personal data, keeping the tombstone, the ledger and scrubbed audit entries', async () => {
    expect(files().objects.size).toBeGreaterThan(0);

    expect((await erase()).status).toBe(204);
    await jobs().drain();

    expect(files().objects.size).toBe(0);
    expect(await query('SELECT FROM files')).toEqual([]);
    expect(await query('SELECT FROM registration_guardians WHERE registration_id = $1', [registrationId])).toEqual([]);
    expect(await query('SELECT FROM declaration_answers')).toEqual([]);
    expect(await query('SELECT FROM consent_signatures')).toEqual([]);
    expect(await query('SELECT FROM document_uploads')).toEqual([]);
    expect(await query('SELECT first_name, last_name, status, answers FROM participants')).toEqual([
      { first_name: 'Smazáno', last_name: '', status: 'cancelled', answers: {} },
    ]);
    expect(await query('SELECT note FROM price_adjustments')).toEqual([{ note: '' }]);
    expect(await query('SELECT amount FROM payments')).toEqual([{ amount: 2000 }]);
    expect(
      await query<{ variable_symbol: string; erased: boolean }>(
        'SELECT variable_symbol, erased_at IS NOT NULL AS erased FROM registrations',
      ),
    ).toEqual([{ variable_symbol: variableSymbol, erased: true }]);
    const scrubbed = await query<{
      changes: unknown;
      ip_address: string | null;
      actor_identity: string | null;
      actor_kind: string;
    }>(
      `SELECT changes, ip_address, actor_identity, actor_kind FROM audit_entries
       WHERE action <> 'registration.erase' AND target_id IN (SELECT $1::uuid UNION SELECT id FROM participants)`,
      [registrationId],
    );
    expect(scrubbed.length).toBeGreaterThan(0);
    expect(scrubbed.every(({ changes, ip_address }) => changes === null && ip_address === null)).toBe(true);
    expect(
      scrubbed
        .filter(({ actor_kind }) => actor_kind === 'guardian')
        .every(({ actor_identity }) => actor_identity === null),
    ).toBe(true);
    expect(await query(`SELECT FROM audit_entries WHERE action = 'registration.erase'`)).toHaveLength(1);
    expect(JSON.stringify(await query('SELECT * FROM audit_entries'))).not.toContain('Testovací');
  });

  it('takes away the portal access of the guardians, and refuses to erase twice', async () => {
    await erase();

    expect((await http().get('/api/portal/registrations').set(guardian)).status).toBe(401);
    expect((await erase()).body.code).toBe('registration_erased');
    expect((await http().get(`/api/registrations/${registrationId}`).set(owner)).status).toBe(200);
    const [participant] = await query<{ id: string }>('SELECT id FROM participants');
    await http().post(`/api/registrations/${registrationId}/participants/${participant?.id}/prihlaska`).set(owner);
    await jobs().drain();
    expect(await query('SELECT FROM files')).toEqual([]);
  });

  it("erases what the guardian's email left beyond the Registration: sessions, marks and their audit trail", async () => {
    await query(
      `INSERT INTO undeliverable_emails (organisation_id, email, reason, marked_at) VALUES ($1, $2, 'bounce', now())`,
      [organisationId, 'jana.testovaci@example.com'],
    );
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, actor_identity, ip_address, action, target_type, target_id)
       VALUES ($1, now(), 'guardian', $2, '203.0.113.7', 'guardian_login_link.use', 'guardian_login_link', $3)`,
      [organisationId, 'jana.testovaci@example.com', organisationId],
    );

    await erase();

    expect(await query('SELECT FROM guardian_sessions')).toEqual([]);
    expect(await query('SELECT FROM undeliverable_emails')).toEqual([]);
    expect(
      await query(`SELECT actor_identity, ip_address FROM audit_entries WHERE action = 'guardian_login_link.use'`),
    ).toEqual([{ actor_identity: null, ip_address: null }]);
  });

  it('takes no new Price adjustment note after the erasure', async () => {
    await erase();

    const refused = await http()
      .post(`/api/registrations/${registrationId}/price-adjustments`)
      .set(owner)
      .send({ amount: -100, note: 'Sleva pro Janu Testovací' });

    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('registration_erased');
  });

  it('is for Owners only', async () => {
    await expectPermission(['owner'], organisationId, (headers) => erase(headers));
  });
});
