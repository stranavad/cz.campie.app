import { Controller, Get } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { PERMISSION_AREAS } from '@repo/schema/admins';
import { CURRENT_LEGAL_VERSIONS } from '@repo/schema/organisations';
import { ACCESS_HEADERS } from '@repo/schema/shared';

import { runOperatorCommand } from '../../../cli/operator-command.ts';
import { Access } from '../../../core/access/access.decorator.ts';
import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { camps } from '../../../db/schema.ts';
import {
  createAdmin,
  createOrganisation,
  mainHost,
  organisationHost,
  signIn,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// Stands in for a console route that tried to reach an Organisation's own data.
@Access('operator')
@Controller('test-console')
class ReachingController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Get('camps')
  public async camps(): Promise<number> {
    return (await this.unitOfWork.db.select().from(camps)).length;
  }

  @Get('enter')
  public async enter(): Promise<number> {
    const [camp] = await this.unitOfWork.db.select().from(camps);
    await this.unitOfWork.enter(camp?.organisationId ?? '00000000-0000-7000-8000-000000000000');

    return (await this.unitOfWork.db.select().from(camps)).length;
  }
}

// An obviously made-up camp association signing up.
const signUpBody = (subdomain: string, email: string) => ({
  legalName: 'Testovací tábornický spolek z. s.',
  ico: '12345679',
  vatId: '',
  address: 'Smyšlená 12, 123 45 Testov',
  statutoryRepresentative: 'Jana Testovací',
  contactEmail: 'kontakt@spolek.example.com',
  contactPhone: '+420 123 456 789',
  billingEmail: 'fakturace@spolek.example.com',
  campName: 'Letní tábor Pokusník',
  subdomain,
  firstName: 'Jana',
  lastName: 'Testovací',
  email,
  password: 'dlouhe heslo pro letni tabor',
  acceptedVersions: { ...CURRENT_LEGAL_VERSIONS },
});

describe('operator console', () => {
  const testApp = useTestApp({ controllers: [ReachingController] });
  const { app, http, database, jobs, mail } = testApp;

  const platform = () => ({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' });
  const list = (headers: RequestHeaders) => http().get('/api/console/organisations').set(headers);
  const act = (headers: RequestHeaders, organisationId: string, action: 'approve' | 'suspend') =>
    http().post(`/api/console/organisations/${organisationId}/${action}`).set(headers);
  const rename = (headers: RequestHeaders, organisationId: string, subdomain: string) =>
    http().patch(`/api/console/organisations/${organisationId}`).set(headers).send({ subdomain });
  const reject = (headers: RequestHeaders, organisationId: string) =>
    http().delete(`/api/console/organisations/${organisationId}`).set(headers);
  const signUp = (subdomain: string, email: string) =>
    http().post('/api/organisations').set(platform()).send(signUpBody(subdomain, email));

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const platformLog = () =>
    query(
      `SELECT actor_kind, actor_identity, host(ip_address) AS ip, action, target_type, target_id, changes
       FROM platform_audit_entries WHERE actor_kind = 'operator' ORDER BY id`,
    );
  const statusOf = async (organisationId: string) =>
    (await query<{ status: string }>(`SELECT status FROM organisations WHERE id = $1`, [organisationId]))[0]?.status;

  describe('access', () => {
    it('admits only the Platform operator, with a session that passed a TOTP code', async () => {
      const operator = await createOperator(testApp);

      expect((await list(operator.headers)).status).toBe(200);
      expect((await list({ Host: mainHost(app()) })).status).toBe(401);
      expect((await list({ ...operator.headers, Host: 'tabor.campie.test' })).status).toBe(404);

      const admin = await createAdmin(app(), { memberOf: [await createOrganisation(app())], owner: true });
      const notOperator = await list(await signIn(app(), admin.id));
      expect(notOperator.status).toBe(403);
      expect(notOperator.body).toMatchObject({ code: 'not_operator' });

      const withoutCode = await list(await signIn(app(), operator.id));
      expect(withoutCode.status).toBe(403);
      expect(withoutCode.body).toMatchObject({ code: 'second_factor_required' });
    });

    it('makes an operator without TOTP set it up before reaching the console', async () => {
      const admin = await createAdmin(app(), { memberOf: [] });
      await runOperatorCommand(database().ownerUrl, ['grant', admin.email]);
      const headers = await signIn(app(), admin.id);

      expect((await list(headers)).body).toMatchObject({ code: 'second_factor_required' });
      expect(
        (await http().post('/api/sessions/current/totp').set(headers).send({ code: '123456' })).body,
      ).toMatchObject({ code: 'totp_not_enabled' });
      expect((await http().post('/api/account/totp').set(headers)).status).toBe(201);
    });

    it('checks the operator flag on every request', async () => {
      const operator = await createOperator(testApp);

      await runOperatorCommand(database().ownerUrl, ['revoke', operator.email]);

      expect((await list(operator.headers)).body).toMatchObject({ code: 'not_operator' });
    });
  });

  it('lists every Organisation, newest first, with its identity and status only', async () => {
    const operator = await createOperator(testApp);
    const older = await createOrganisation(app(), { subdomain: 'starsi', status: 'approved' });
    const newer = await createOrganisation(app(), { subdomain: 'novejsi', status: 'pending' });

    const response = await list(operator.headers);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      [newer, older].map((id) => ({
        id,
        subdomain: id === newer ? 'novejsi' : 'starsi',
        status: id === newer ? 'pending' : 'approved',
        displayName: expect.stringMatching(/^Tábor /),
        legalName: expect.stringMatching(/^Testovací spolek /),
        ico: '12345678',
        vatId: null,
        address: 'Smyšlená 1, 123 45 Testov',
        statutoryRepresentative: 'Jana Testovací',
        contactEmail: expect.stringMatching(/^kontakt-.*@example\.com$/),
        contactPhone: '+420 123 456 789',
        mail: { sent: 0, bounced: 0, complained: 0 },
      })),
    );
  });

  it('approves a pending Organisation once, audited as the Platform operator', async () => {
    const operator = await createOperator(testApp);
    const organisationId = await createOrganisation(app(), { status: 'pending' });

    const approved = await act(operator.headers, organisationId, 'approve');

    expect(approved.status).toBe(200);
    expect(approved.body).toMatchObject({ id: organisationId, status: 'approved' });
    expect(await platformLog()).toEqual([
      {
        actor_kind: 'operator',
        actor_identity: operator.id,
        ip: expect.any(String),
        action: 'organisation.approve',
        target_type: 'organisation',
        target_id: organisationId,
        changes: { status: { old: 'pending', new: 'approved' } },
      },
    ]);

    const again = await act(operator.headers, organisationId, 'approve');
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ code: 'organisation_not_pending' });
    expect(await platformLog()).toHaveLength(1);
  });

  it('renames a pending Organisation within the subdomain rules, and never an approved one', async () => {
    const operator = await createOperator(testApp);
    const organisationId = await createOrganisation(app(), { subdomain: 'puvodni', status: 'pending' });
    await createOrganisation(app(), { subdomain: 'obsazeno', status: 'pending' });

    expect((await rename(operator.headers, organisationId, 'admin')).body).toMatchObject({
      code: 'subdomain_reserved',
    });
    expect((await rename(operator.headers, organisationId, 'ne--platne')).body).toMatchObject({
      code: 'subdomain_malformed',
    });
    const taken = await rename(operator.headers, organisationId, 'obsazeno');
    expect(taken.status).toBe(409);
    expect(taken.body).toMatchObject({ code: 'subdomain_taken' });

    const renamed = await rename(operator.headers, organisationId, ' Nove-Jmeno ');
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({ subdomain: 'nove-jmeno', status: 'pending' });
    expect(await organisationHost(app(), organisationId)).toBe('nove-jmeno.campie.test');
    expect(await platformLog()).toEqual([
      expect.objectContaining({
        action: 'organisation.update',
        target_id: organisationId,
        changes: { subdomain: { old: 'puvodni', new: 'nove-jmeno' } },
      }),
    ]);

    await act(operator.headers, organisationId, 'approve');
    const fixed = await rename(operator.headers, organisationId, 'jeste-jine');
    expect(fixed.status).toBe(409);
    expect(fixed.body).toMatchObject({ code: 'organisation_not_pending' });
  });

  it('rejects a pending Organisation: deleted with its data, its subdomain and its signer free again', async () => {
    const operator = await createOperator(testApp);
    expect((await signUp('pokusnik', 'jana.testovaci@example.com')).status).toBe(204);
    const [signed] = await query<{ id: string }>(`SELECT id FROM organisations WHERE subdomain = 'pokusnik'`);
    const organisationId = signed?.id ?? '';
    const [signer] = await query<{ id: string }>(`SELECT id FROM admins WHERE email = 'jana.testovaci@example.com'`);
    const signerId = signer?.id;
    // A member who belongs to another Organisation as well keeps their account.
    const other = await createOrganisation(app(), { status: 'approved' });
    const member = await createAdmin(app(), { memberOf: [organisationId, other] });

    const rejected = await reject(operator.headers, organisationId);

    expect(rejected.status).toBe(204);
    expect((await list(operator.headers)).body).toEqual([expect.objectContaining({ id: other })]);
    expect(await query(`SELECT count(*)::int AS n FROM camps`)).toEqual([{ n: 0 }]);
    expect(await query(`SELECT email FROM admins ORDER BY email`)).toEqual(
      [{ email: member.email }, { email: operator.email }].toSorted((a, b) => a.email.localeCompare(b.email)),
    );
    expect(await platformLog()).toEqual([
      expect.objectContaining({
        action: 'organisation.remove',
        target_type: 'organisation',
        target_id: organisationId,
        changes: expect.objectContaining({ subdomain: { old: 'pokusnik', new: null } }),
      }),
      expect.objectContaining({ action: 'admin.remove', target_type: 'admin', target_id: signerId, changes: null }),
    ]);

    expect((await signUp('pokusnik', 'jana.testovaci@example.com')).status).toBe(204);
  });

  it('keeps an account that signed for another Organisation, though it belongs nowhere else now', async () => {
    const operator = await createOperator(testApp);
    expect((await signUp('drivejsi', 'zakladatel@example.com')).status).toBe(204);
    const [founder] = await query<{ id: string; organisation_id: string }>(
      `SELECT admin_id AS id, organisation_id FROM memberships`,
    );
    // Another Owner takes over the first Organisation; the founder then helps with a new, pending one.
    await createAdmin(app(), { memberOf: [founder?.organisation_id ?? ''], owner: true });
    await query(`DELETE FROM memberships WHERE admin_id = $1`, [founder?.id]);
    const pending = await createOrganisation(app(), { status: 'pending' });
    await query(`INSERT INTO memberships (organisation_id, admin_id, owner) VALUES ($1, $2, true)`, [
      pending,
      founder?.id,
    ]);

    expect((await reject(operator.headers, pending)).status).toBe(204);

    expect(await query(`SELECT id FROM admins WHERE id = $1`, [founder?.id])).toEqual([{ id: founder?.id }]);
  });

  it('rejects only a pending Organisation', async () => {
    const operator = await createOperator(testApp);
    const organisationId = await createOrganisation(app(), { status: 'approved' });

    const refused = await reject(operator.headers, organisationId);

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'organisation_not_pending' });
    expect(await statusOf(organisationId)).toBe('approved');
    expect((await reject(operator.headers, '00000000-0000-7000-8000-000000000000')).status).toBe(404);
  });

  it('suspends an approved Organisation: its subdomain goes offline and its mail stops', async () => {
    const operator = await createOperator(testApp);
    const organisationId = await createOrganisation(app(), { status: 'approved' });
    const owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    const publicHeaders = { Host: await organisationHost(app(), organisationId) };

    expect((await http().get('/api/organisation').set(publicHeaders)).status).toBe(200);

    const suspended = await act(operator.headers, organisationId, 'suspend');

    expect(suspended.status).toBe(200);
    expect(suspended.body).toMatchObject({ status: 'suspended' });
    expect(await platformLog()).toEqual([
      expect.objectContaining({
        action: 'organisation.suspend',
        changes: { status: { old: 'approved', new: 'suspended' } },
      }),
    ]);

    const offline = await http().get('/api/organisation').set(publicHeaders);
    expect(offline.status).toBe(403);
    expect(offline.body).toMatchObject({ code: 'organisation_suspended' });

    const invited = await http()
      .post('/api/invitations')
      .set(owner.headers(organisationId))
      .send({
        email: 'nova-vedouci@example.com',
        permissions: Object.fromEntries(PERMISSION_AREAS.map((area) => [area, 'read'])),
      });
    expect(invited.status).toBe(201);
    await jobs().drain();
    expect(mail().sent).toEqual([]);
    expect(await jobs().failed()).toEqual([]);

    const again = await act(operator.headers, organisationId, 'suspend');
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ code: 'organisation_not_approved' });
  });

  it('suspends only an approved Organisation', async () => {
    const operator = await createOperator(testApp);
    const organisationId = await createOrganisation(app(), { status: 'pending' });

    expect((await act(operator.headers, organisationId, 'suspend')).body).toMatchObject({
      code: 'organisation_not_approved',
    });
    expect(await statusOf(organisationId)).toBe('pending');
  });

  it("cannot reach any Organisation's own data, not even by entering it", async () => {
    const operator = await createOperator(testApp);
    await createOrganisation(app(), { status: 'pending' });
    expect(await query(`SELECT count(*)::int AS n FROM camps`)).toEqual([{ n: 0 }]);
    expect((await signUp('pokusnik', 'jana.testovaci@example.com')).status).toBe(204);
    expect(await query(`SELECT count(*)::int AS n FROM camps`)).toEqual([{ n: 1 }]);

    expect((await http().get('/api/test-console/camps').set(operator.headers)).text).toBe('0');
    expect((await http().get('/api/test-console/enter').set(operator.headers)).status).toBe(500);
  });
});
