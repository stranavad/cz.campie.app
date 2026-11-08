import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { mainHost, signUpOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const EMAIL = 'jana.testovaci@example.com';
const PASSWORD = 'dlouhe heslo pro letni tabor';

describe('email verification', () => {
  const { app, http, mail, jobs, clock, database } = useTestApp();

  const complete = (token: string) =>
    http()
      .post('/api/email-verifications/complete')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send({ token });

  const emailVerified = async (headers: RequestHeaders) =>
    ((await http().get('/api/account').set(headers)).body as { emailVerified: boolean }).emailVerified;

  // Runs the queued jobs and returns the token of the newest verification link mailed.
  const readLink = async (): Promise<string> => {
    await jobs().drain();
    const links = mail()
      .sent.map(({ text }) => /https:\/\/app\.campie\.test\/overeni-emailu\?token=([\w-]+)/.exec(text ?? '')?.[1])
      .filter((token) => token !== undefined);

    if (links.length === 0) {
      throw new Error('No verification link was sent');
    }

    return links.at(-1) ?? '';
  };

  it('mails a link from the auth stream at signup, which verifies the email once', async () => {
    const owner = await signUpOrganisation(app(), { email: EMAIL, password: PASSWORD });
    const token = await readLink();

    expect(mail().sent).toContainEqual(
      expect.objectContaining({ from: '"Campie" <prihlaseni@auth.campie.test>', to: [EMAIL] }),
    );
    expect(await emailVerified(owner.headers)).toBe(false);

    expect((await complete(token)).status).toBe(204);
    expect(await emailVerified(owner.headers)).toBe(true);

    expect((await complete(token)).body).toMatchObject({ statusCode: 400, code: 'email_verification_invalid' });
  });

  it('refuses a link once it expired, and sends a new one when asked again', async () => {
    const owner = await signUpOrganisation(app(), { email: EMAIL, password: PASSWORD });
    const expired = await readLink();

    clock().advance(7 * 24 * 60 * 60 * 1000);
    expect((await complete(expired)).body).toMatchObject({ statusCode: 400, code: 'email_verification_invalid' });

    const loggedIn = await http()
      .post('/api/sessions')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send({ email: EMAIL, password: PASSWORD });
    const headers = { ...owner.headers, Cookie: String(loggedIn.headers['set-cookie']).split(';')[0] ?? '' };
    expect((await http().post('/api/email-verifications').set(headers)).status).toBe(204);
    const fresh = await readLink();

    expect(fresh).not.toBe(expired);
    expect((await complete(fresh)).status).toBe(204);
    expect(await emailVerified(headers)).toBe(true);
  });

  it("records the verification in the signup Organisation's log as the Owner", async () => {
    const owner = await signUpOrganisation(app(), { email: EMAIL, password: PASSWORD });
    await complete(await readLink());

    const entries = await withClient(database().ownerUrl, async (client) =>
      (
        await client.query(
          "SELECT actor_identity, target_id, changes FROM audit_entries WHERE organisation_id = $1 AND action = 'admin.verify_email'",
          [owner.organisationId],
        )
      ).rows.map(({ actor_identity, target_id, changes }) => ({ actor: actor_identity, target: target_id, changes })),
    );
    const adminId = (
      await withClient(database().ownerUrl, (client) => client.query('SELECT id FROM admins WHERE email = $1', [EMAIL]))
    ).rows[0]?.id;

    expect(entries).toEqual([
      {
        actor: adminId,
        target: adminId,
        changes: { emailVerifiedAt: { old: null, new: clock().now().toISOString() } },
      },
    ]);
  });
});
