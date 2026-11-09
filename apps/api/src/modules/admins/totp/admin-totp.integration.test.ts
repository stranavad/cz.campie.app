import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import type { TotpEnrolment } from '@repo/schema/admins';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { totpCode } from '../../../core/totp/totp.ts';
import { MembershipRepository } from '../../../repositories/admins/membership/membership.repository.ts';
import { createAdmin, createOrganisation, signIn, type RequestHeaders } from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { decodeBase32, enrolTotp, withSessionFrom } from '../../../testing/totp.ts';

const THIRTY_SECONDS = 30 * 1000;

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('two-step login for admins', () => {
  const testApp = useTestApp({ env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '3', LOGIN_LOCKOUT_MINUTES: '15' } });
  const { app, http, clock, database, jobs, mail } = testApp;

  let organisationId: string;
  let owner: Admin;
  let member: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { displayName: 'Tábor Testov' });
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    member = await createAdmin(app(), { memberOf: [organisationId] });
  });

  const inOrganisation = (headers: RequestHeaders): RequestHeaders => ({
    ...headers,
    'x-organisation-id': organisationId,
  });
  const verify = (headers: RequestHeaders, code: string) =>
    http().post('/api/sessions/current/totp').set(headers).send({ code });
  const members = (headers: RequestHeaders) => http().get('/api/members').set(inOrganisation(headers));
  // A route every member reaches.
  const camps = (headers: RequestHeaders) => http().get('/api/camps').set(inOrganisation(headers));
  const memberIdOf = async (admin: { email: string }): Promise<string> => {
    const listed: { id: string; email: string }[] = (await members(owner.headers(''))).body;

    return listed.find(({ email }) => email === admin.email)?.id ?? '';
  };
  const auditActions = () =>
    withClient(
      database().ownerUrl,
      async (client) =>
        (
          await client.query<{ action: string; organisation_id: string }>(
            'SELECT action, organisation_id FROM audit_entries',
          )
        ).rows,
    );

  it('asks a later login for a code or an unused recovery code, each recovery code once', async () => {
    const { secret, recoveryCodes, headers } = await enrolTotp(http(), member.headers(''), clock().now());
    expect(recoveryCodes).toHaveLength(10);
    expect(new Set(recoveryCodes).size).toBe(10);
    expect((await camps(headers)).status).toBe(200);

    clock().advance(THIRTY_SECONDS);
    const later = await signIn(app(), member.id);
    const refused = await camps(later);
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'second_factor_required' });

    const [recoveryCode = ''] = recoveryCodes;
    const recovered = await verify(later, recoveryCode);
    expect(recovered.status).toBe(204);
    expect((await camps(withSessionFrom(later, recovered))).status).toBe(200);

    const again = await signIn(app(), member.id);
    expect((await verify(again, recoveryCode)).body).toMatchObject({ code: 'totp_code_invalid' });
    expect((await verify(again, totpCode(secret, clock().now()))).status).toBe(204);
  });

  it('counts wrong recovery codes toward the failed-attempt limit', async () => {
    const { recoveryCodes } = await enrolTotp(http(), member.headers(''), clock().now());
    const later = await signIn(app(), member.id);

    for (const _ of [1, 2, 3]) {
      expect((await verify(later, 'aaaa-aaaa')).body).toMatchObject({ code: 'totp_code_invalid' });
    }

    const locked = await verify(later, recoveryCodes[0] ?? '');
    expect(locked.status).toBe(429);
    expect(locked.body).toMatchObject({ code: 'totp_throttled' });
  });

  it('with enforcement on, lets a member without TOTP reach only the setup until they set it up', async () => {
    const required = await http()
      .put('/api/organisation-settings/totp')
      .set(owner.headers(organisationId))
      .send({ required: true });
    expect(required.status).toBe(200);
    expect(required.body).toMatchObject({ totpRequired: true });

    const refused = await camps(member.headers(''));
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'totp_setup_required' });
    expect((await http().get('/api/account').set(member.headers(''))).body).toMatchObject({
      totp: null,
      memberships: [{ organisation: { id: organisationId, totpRequired: true } }],
    });

    const { headers } = await enrolTotp(http(), member.headers(''), clock().now());
    expect((await camps(headers)).status).toBe(200);

    expect((await auditActions()).map(({ action }) => action)).toContain('organisation.update');
  });

  it('lets only an Owner require two-step login', async () => {
    const refused = await http()
      .put('/api/organisation-settings/totp')
      .set(member.headers(organisationId))
      .send({ required: true });

    expect(refused.status).toBe(403);
  });

  it("lets an Owner reset a member's TOTP, audited and emailed to the member", async () => {
    await enrolTotp(http(), member.headers(''), clock().now());
    expect((await members(owner.headers(''))).body).toContainEqual(
      expect.objectContaining({ email: member.email, totpEnabled: true }),
    );

    const reset = await http()
      .delete(`/api/members/${await memberIdOf(member)}/totp`)
      .set(owner.headers(organisationId));
    expect(reset.status).toBe(204);

    await http().get('/api/account').set(member.headers('')).expect(401);
    const later = await signIn(app(), member.id);
    expect((await camps(later)).status).toBe(200);
    expect((await http().get('/api/account').set(later)).body).toMatchObject({ totp: null });
    expect(await auditActions()).toEqual([{ action: 'member.reset_totp', organisation_id: organisationId }]);

    await jobs().drain();
    expect(mail().sent).toHaveLength(1);
    expect(mail().sent[0]).toMatchObject({ to: [member.email] });
    expect(mail().sent[0]?.text).toContain('Vypnul: vlastník organizace');
  });

  it('leaves the reset of an admin with access beyond the Organisation to the console', async () => {
    const elsewhere = await createOrganisation(app());
    const shared = await createAdmin(app(), { memberOf: [organisationId, elsewhere] });
    const operator = await createOperator(testApp);
    await app()
      .get(UnitOfWork)
      .run(organisationId, () => app().get(MembershipRepository).create({ adminId: operator.id, owner: false }));
    await enrolTotp(http(), shared.headers(''), clock().now());

    for (const admin of [shared, operator]) {
      const refused = await http()
        .delete(`/api/members/${await memberIdOf(admin)}/totp`)
        .set(owner.headers(organisationId));
      expect(refused.status).toBe(409);
      expect(refused.body).toMatchObject({ code: 'totp_reset_elsewhere' });
    }

    expect(await auditActions()).toEqual([]);
  });

  it('stores the recovery codes keyed, not as their bare hash', async () => {
    const { recoveryCodes } = await enrolTotp(http(), member.headers(''), clock().now());
    const bare = createHash('sha256')
      .update(recoveryCodes[0] ?? '')
      .digest('hex');

    const stored = await withClient(
      database().ownerUrl,
      async (client) => (await client.query<{ code_hash: string }>('SELECT code_hash FROM totp_recovery_codes')).rows,
    );

    expect(stored).toHaveLength(10);
    expect(stored.map(({ code_hash }) => code_hash)).not.toContain(bare);
  });

  it('makes new recovery codes for a passed session and a current app code only, audited and emailed', async () => {
    const { secret, recoveryCodes, headers } = await enrolTotp(http(), member.headers(''), clock().now());
    const regenerate = (sent: RequestHeaders, code: string) =>
      http().post('/api/account/totp/recovery-codes').set(sent).send({ code });
    const [oldCode = ''] = recoveryCodes;
    clock().advance(THIRTY_SECONDS);

    expect((await regenerate(headers, oldCode)).status).toBe(400);
    expect((await regenerate(headers, '000000')).body).toMatchObject({ code: 'totp_code_invalid' });
    const unpassed = await signIn(app(), member.id);
    expect((await regenerate(unpassed, totpCode(secret, clock().now()))).body).toMatchObject({
      code: 'second_factor_required',
    });

    const made = await regenerate(headers, totpCode(secret, clock().now()));

    expect(made.status).toBe(200);
    const fresh: string[] = made.body.recoveryCodes;
    expect(fresh).toHaveLength(10);
    expect(fresh.filter((code) => recoveryCodes.includes(code))).toEqual([]);
    expect((await regenerate(headers, totpCode(secret, clock().now()))).body).toMatchObject({
      code: 'totp_code_invalid',
    });
    expect((await verify(await signIn(app(), member.id), oldCode)).body).toMatchObject({ code: 'totp_code_invalid' });
    expect((await verify(await signIn(app(), member.id), fresh[0] ?? '')).status).toBe(204);
    expect(
      await withClient(
        database().ownerUrl,
        async (client) =>
          (
            await client.query(
              `SELECT actor_kind, actor_identity, target_id FROM platform_audit_entries
                WHERE action = 'admin.regenerate_recovery_codes'`,
            )
          ).rows,
      ),
    ).toEqual([{ actor_kind: 'admin', actor_identity: member.id, target_id: member.id }]);
    await jobs().drain();
    expect(mail().sent.map(({ to, subject }) => ({ to, subject }))).toEqual([
      { to: [member.email], subject: 'Nové záložní kódy pro dvoufázové přihlášení' },
    ]);
  });

  it("refuses a member's TOTP reset to anyone but an Owner", async () => {
    const ownerId = await memberIdOf(owner);
    await enrolTotp(http(), owner.headers(''), clock().now());

    const refused = await http().delete(`/api/members/${ownerId}/totp`).set(member.headers(organisationId));

    expect(refused.status).toBe(403);
    expect(await auditActions()).toEqual([]);
  });

  it("lets the operator reset a locked-out Owner from the console, audited in the Organisation's log", async () => {
    const operator = await createOperator(testApp);
    await enrolTotp(http(), owner.headers(''), clock().now());
    mail().sent.length = 0;

    const reset = await http()
      .post(`/api/console/organisations/${organisationId}/owner-totp-reset`)
      .set(operator.headers)
      .send({ email: owner.email });
    expect(reset.status).toBe(204);

    expect(
      (
        await http()
          .get('/api/account')
          .set(await signIn(app(), owner.id))
      ).body,
    ).toMatchObject({
      totp: null,
    });
    expect(await auditActions()).toEqual([{ action: 'member.reset_totp', organisation_id: organisationId }]);

    await jobs().drain();
    expect(mail().sent.map(({ to }) => to)).toEqual([[owner.email]]);
    expect(mail().sent[0]?.text).toContain('Vypnul: provozovatel platformy');
  });

  it('resets only an Owner of the named Organisation from the console, and only for the operator', async () => {
    const operator = await createOperator(testApp);
    await enrolTotp(http(), member.headers(''), clock().now());
    const reset = (headers: RequestHeaders, email: string) =>
      http().post(`/api/console/organisations/${organisationId}/owner-totp-reset`).set(headers).send({ email });

    expect((await reset(operator.headers, member.email)).status).toBe(404);
    expect((await reset(operator.headers, 'nobody@example.com')).status).toBe(404);
    expect((await reset(owner.headers(''), owner.email)).status).toBe(403);
    expect(
      (
        await http()
          .get('/api/account')
          .set(await signIn(app(), member.id))
      ).body,
    ).toMatchObject({
      totp: expect.anything(),
    });
    expect(await auditActions()).toEqual([]);
  });

  const accountOf = async (headers: RequestHeaders) => (await http().get('/api/account').set(headers)).body;
  const platformEntries = () =>
    withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query('SELECT actor_identity, action, target_id, changes FROM platform_audit_entries')).rows,
    );

  it('reports when two-step login was turned on and how many recovery codes are left', async () => {
    const enabledAt = clock().now().toISOString();
    const { recoveryCodes, headers } = await enrolTotp(http(), member.headers(''), clock().now());
    expect(await accountOf(headers)).toMatchObject({
      totp: { enabledAt, recoveryCodesLeft: 10, recoveryCodesIssued: 10 },
    });

    clock().advance(THIRTY_SECONDS);
    expect((await verify(await signIn(app(), member.id), recoveryCodes[0] ?? '')).status).toBe(204);

    expect(await accountOf(headers)).toMatchObject({
      totp: { enabledAt, recoveryCodesLeft: 9, recoveryCodesIssued: 10 },
    });
  });

  describe('moving to a new phone', () => {
    const startReplacement = (headers: RequestHeaders, code: string) =>
      http().post('/api/account/totp/replacement').set(headers).send({ code });
    const confirmReplacement = (headers: RequestHeaders, code: string) =>
      http().post('/api/account/totp/replacement/confirm').set(headers).send({ code });

    it('replaces the secret only once a code from the new app confirms it, keeping the recovery codes', async () => {
      const enabledAt = clock().now().toISOString();
      const { secret: oldSecret, recoveryCodes, headers } = await enrolTotp(http(), member.headers(''), clock().now());
      clock().advance(THIRTY_SECONDS);

      const started = await startReplacement(headers, totpCode(oldSecret, clock().now()));
      expect(started.status).toBe(200);
      const newSecret = decodeBase32((started.body as TotpEnrolment).secret);
      expect(newSecret.equals(oldSecret)).toBe(false);

      clock().advance(THIRTY_SECONDS);
      expect((await verify(await signIn(app(), member.id), totpCode(newSecret, clock().now()))).status).toBe(400);
      expect((await verify(await signIn(app(), member.id), totpCode(oldSecret, clock().now()))).status).toBe(204);
      expect(await platformEntries()).toEqual([]);

      clock().advance(THIRTY_SECONDS);
      expect((await confirmReplacement(headers, totpCode(newSecret, clock().now()))).status).toBe(204);

      clock().advance(THIRTY_SECONDS);
      const oldApp = await verify(await signIn(app(), member.id), totpCode(oldSecret, clock().now()));
      expect(oldApp.body).toMatchObject({ code: 'totp_code_invalid' });
      expect((await verify(await signIn(app(), member.id), totpCode(newSecret, clock().now()))).status).toBe(204);
      expect((await verify(await signIn(app(), member.id), recoveryCodes[0] ?? '')).status).toBe(204);
      expect(await accountOf(headers)).toMatchObject({
        totp: { enabledAt, recoveryCodesLeft: 9, recoveryCodesIssued: 10 },
      });
      expect((await camps(headers)).status).toBe(200);

      expect(await platformEntries()).toEqual([
        { actor_identity: member.id, action: 'admin.replace_totp', target_id: member.id, changes: null },
      ]);
      expect(await auditActions()).toEqual([]);
      await jobs().drain();
      expect(mail().sent.map(({ to, subject }) => ({ to, subject }))).toEqual([
        { to: [member.email], subject: 'Dvoufázové přihlášení je v novém telefonu' },
      ]);
    });

    it('needs a current code from the old app, once, and a session that passed two-step login', async () => {
      const { secret, recoveryCodes, headers } = await enrolTotp(http(), member.headers(''), clock().now());
      clock().advance(THIRTY_SECONDS);
      const code = totpCode(secret, clock().now());

      expect((await startReplacement(headers, '000000')).body).toMatchObject({ code: 'totp_code_invalid' });
      expect((await startReplacement(headers, recoveryCodes[0] ?? '')).status).toBe(400);
      expect((await startReplacement(await signIn(app(), member.id), code)).body).toMatchObject({
        code: 'second_factor_required',
      });
      expect((await startReplacement(headers, code)).status).toBe(200);
      expect((await startReplacement(headers, code)).body).toMatchObject({ code: 'totp_code_invalid' });
    });

    it('refuses to confirm without a replacement started, or with a code of the old app', async () => {
      const { secret, headers } = await enrolTotp(http(), member.headers(''), clock().now());
      clock().advance(THIRTY_SECONDS);

      expect((await confirmReplacement(headers, totpCode(secret, clock().now()))).body).toMatchObject({
        code: 'totp_not_started',
      });
      await startReplacement(headers, totpCode(secret, clock().now()));
      clock().advance(THIRTY_SECONDS);
      expect((await confirmReplacement(headers, totpCode(secret, clock().now()))).body).toMatchObject({
        code: 'totp_code_invalid',
      });
      expect(await platformEntries()).toEqual([]);
    });

    it('refuses an admin without two-step login', async () => {
      const refused = await startReplacement(member.headers(''), '123456');

      expect(refused.body).toMatchObject({ statusCode: 409, code: 'totp_not_enabled' });
    });
  });
});
