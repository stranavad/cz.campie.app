import { describe, expect, it } from 'vitest';

import { SESSION_COOKIES } from '../../../core/sessions/session-cookie.ts';
import {
  createCamp,
  createOrganisation,
  organisationHost,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const JANA = 'jana.testovaci@example.com';
const PETR = 'petr.testovaci@example.com';

const usePortal = (env: Record<string, string> = {}) => {
  const testApp = useTestApp({ env });
  const { app, http, jobs, mail } = testApp;

  // An Organisation with a Camp and a Registration naming Jana and Petr.
  const arrange = async () => {
    const organisationId = await createOrganisation(app());
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    const { id } = await submitRegistration(app(), organisationId, campId, { secondGuardian: true });
    await jobs().drain();
    mail().sent.length = 0;

    return { organisationId, campId, registrationId: id, host: await organisationHost(app(), organisationId) };
  };
  const requestLink = (host: string, email: string) =>
    http().post('/api/portal/login-links').set({ Host: host, 'x-csrf-protection': '1' }).send({ email });
  // The link's token from the last login mail.
  const tokenFromMail = () =>
    /token=([\w-]+)/.exec(mail().sent.findLast(({ html }) => html.includes('token='))?.html ?? '')?.[1] ?? '';
  const useLink = (host: string, token: string) =>
    http().post('/api/portal/session').set({ Host: host, 'x-csrf-protection': '1' }).send({ token });
  const signInAs = async (host: string, email: string): Promise<RequestHeaders> => {
    await requestLink(host, email);
    await jobs().drain();
    const cookie = sessionCookie(await useLink(host, tokenFromMail()));

    return { Host: host, Cookie: cookie?.split(';')[0] ?? '', 'x-csrf-protection': '1' };
  };

  return { ...testApp, arrange, requestLink, tokenFromMail, useLink, signInAs };
};

/**
 * Find the guardian session cookie a response sets.
 * @param response the response
 */
function sessionCookie(response: { headers: Record<string, unknown> }): string | undefined {
  const cookies = response.headers['set-cookie'];

  return Array.isArray(cookies)
    ? cookies.map(String).find((cookie) => cookie.startsWith(SESSION_COOKIES.guardian))
    : undefined;
}

describe('guardian login', () => {
  const { app, http, clock, jobs, mail, database, arrange, requestLink, tokenFromMail, useLink, signInAs } =
    usePortal();

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  it('answers an unknown email as a known one, and emails only the guardian a link from the auth stream', async () => {
    const { host } = await arrange();

    const unknown = await requestLink(host, 'nikdo@example.com');
    const known = await requestLink(host, 'Jana.Testovaci@example.com');
    await jobs().drain();

    expect(unknown.status).toBe(204);
    expect(known.status).toBe(204);
    expect(mail().sent).toMatchObject([{ to: [JANA], from: '"Letní tábor" <prihlaseni@auth.campie.test>' }]);
    expect(mail().sent[0]?.html).toContain(`https://${host}/portal/prihlaseni?token=`);
  });

  it('signs the guardian in once by the link, with a host-only, httpOnly, Secure, Lax cookie, audited', async () => {
    const { host } = await arrange();
    await requestLink(host, JANA);
    await jobs().drain();
    const token = tokenFromMail();

    const used = await useLink(host, token);

    expect(used.status).toBe(204);
    const cookie = sessionCookie(used) ?? '';
    expect(cookie).toMatch(/; Path=\//);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).not.toMatch(/Domain=/);
    expect(
      await query('SELECT action, actor_kind, actor_identity FROM audit_entries WHERE action LIKE $1', ['guardian_%']),
    ).toEqual([{ action: 'guardian_login_link.use', actor_kind: 'guardian', actor_identity: JANA }]);

    const again = await useLink(host, token);
    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ code: 'login_link_invalid' });
  });

  it('lets a link work for 30 minutes and no longer', async () => {
    const { host } = await arrange();
    const linkAt = async (instant: string) => {
      clock().set(new Date(instant));
      await requestLink(host, JANA);
      await jobs().drain();

      return tokenFromMail();
    };

    const expiring = await linkAt('2027-04-10T10:00:00Z');
    clock().set(new Date('2027-04-10T10:30:00Z'));
    expect((await useLink(host, expiring)).status).toBe(400);

    const lasting = await linkAt('2027-04-10T11:00:00Z');
    clock().set(new Date('2027-04-10T11:29:59Z'));
    expect((await useLink(host, lasting)).status).toBe(204);
  });

  it('signs in once when one link is used twice at the same moment', async () => {
    const { host } = await arrange();
    await requestLink(host, JANA);
    await jobs().drain();
    const token = tokenFromMail();

    const results = await Promise.all([useLink(host, token), useLink(host, token)]);

    expect(results.map(({ status }) => status).sort((a, b) => a - b)).toEqual([204, 400]);
  });

  it("stops the guardian's other links once one signed them in", async () => {
    const { host } = await arrange();
    await requestLink(host, JANA);
    await jobs().drain();
    const older = tokenFromMail();
    await requestLink(host, JANA);
    await jobs().drain();

    expect((await useLink(host, tokenFromMail())).status).toBe(204);
    expect((await useLink(host, older)).status).toBe(400);
  });

  it("refuses a link on another Organisation's subdomain", async () => {
    const { host } = await arrange();
    const otherHost = (await arrange()).host;
    await requestLink(host, JANA);
    await jobs().drain();

    expect((await useLink(otherHost, tokenFromMail())).status).toBe(400);
  });

  it('shows a guardian only the Registrations that name them, both guardians alike', async () => {
    const { host, organisationId, campId, registrationId } = await arrange();
    // A second Registration that names Jana only.
    const janaOnly = await submitRegistration(app(), organisationId, campId);
    const asPetr = await signInAs(host, PETR);
    const asJana = await signInAs(host, JANA);

    const petrs = (await http().get('/api/portal/registrations').set(asPetr)).body.registrations;
    expect(petrs.map(({ id }: { id: string }) => id)).toEqual([registrationId]);
    expect(petrs[0]).toMatchObject({ camp: { name: 'Letní tábor' }, participants: [{ firstName: 'Ema' }] });
    expect((await http().get('/api/portal/registrations').set(asJana)).body.registrations).toHaveLength(2);

    expect((await http().get(`/api/portal/registrations/${janaOnly.id}`).set(asPetr)).status).toBe(404);
    expect((await http().get(`/api/portal/registrations/${janaOnly.id}`).set(asJana)).status).toBe(200);
  });

  it('takes access away on the next request once the email leaves the Registration', async () => {
    const { host, registrationId } = await arrange();
    const asPetr = await signInAs(host, PETR);
    expect((await http().get(`/api/portal/registrations/${registrationId}`).set(asPetr)).status).toBe(200);

    await query("UPDATE registration_guardians SET email = 'petr.jinak@example.com' WHERE email = $1", [PETR]);

    expect((await http().get(`/api/portal/registrations/${registrationId}`).set(asPetr)).status).toBe(404);
    expect((await http().get('/api/portal/registrations').set(asPetr)).body.registrations).toEqual([]);
  });

  it("refuses a guardian session on another Organisation's subdomain", async () => {
    const { host } = await arrange();
    const asJana = await signInAs(host, JANA);
    const otherHost = (await arrange()).host;

    expect(
      (
        await http()
          .get('/api/portal/registrations')
          .set({ ...asJana, Host: otherHost })
      ).status,
    ).toBe(401);
  });

  it('signs out, ending the session', async () => {
    const { host } = await arrange();
    const asJana = await signInAs(host, JANA);

    const ended = await http().delete('/api/portal/session').set(asJana);

    expect(ended.status).toBe(204);
    expect(sessionCookie(ended)).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
    expect((await http().get('/api/portal/registrations').set(asJana)).status).toBe(401);
  });
});

describe('guardian login limits', () => {
  const { arrange, requestLink } = usePortal({ LOGIN_LINK_LIMIT_PER_EMAIL: '1' });

  it('refuses more links for one email past its limit with 429, known or not', async () => {
    const { host } = await arrange();

    expect((await requestLink(host, JANA)).status).toBe(204);
    const refused = await requestLink(host, JANA);
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'requests_throttled' });

    expect((await requestLink(host, 'nikdo@example.com')).status).toBe(204);
    expect((await requestLink(host, 'nikdo@example.com')).status).toBe(429);
  });

  it("counts an email's limit per Organisation, so another subdomain's flood locks nobody out", async () => {
    const { host } = await arrange();
    const otherHost = (await arrange()).host;

    expect((await requestLink(otherHost, JANA)).status).toBe(204);
    expect((await requestLink(host, JANA)).status).toBe(204);
  });
});
