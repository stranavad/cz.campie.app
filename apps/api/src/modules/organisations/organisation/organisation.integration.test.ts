import { describe, expect, it } from 'vitest';

import { CURRENT_LEGAL_VERSIONS, type SignUpOrganisationBody } from '@repo/schema/organisations';
import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createOrganisation, mainHost } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// An obviously made-up camp association, with a valid IČO.
const SIGNUP: Omit<SignUpOrganisationBody, 'vatId'> & { vatId: string } = {
  legalName: 'Testovací tábornický spolek z. s.',
  ico: '12345679',
  vatId: '',
  address: 'Smyšlená 12, 123 45 Testov',
  statutoryRepresentative: 'Jana Testovací',
  contactEmail: 'kontakt@spolek.example.com',
  contactPhone: '+420 123 456 789',
  billingEmail: 'fakturace@spolek.example.com',
  campName: 'Letní tábor Pokusník',
  subdomain: 'pokusnik',
  email: 'Jana.Testovaci@Example.com',
  password: 'dlouhe-testovaci-heslo',
  acceptedVersions: { ...CURRENT_LEGAL_VERSIONS },
};

describe('organisation signup', () => {
  const { app, http, clock, mail, jobs, database } = useTestApp();

  const signUp = (body: Partial<typeof SIGNUP> = {}) =>
    http()
      .post('/api/organisations')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send({ ...SIGNUP, ...body });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const sessionCookie = (header: unknown) => String(header).split(';')[0] ?? '';

  it('creates the Organisation pending approval, with its data key, one Camp and its Owner', async () => {
    const response = await signUp();

    expect(response.status).toBe(204);

    const organisations = await query<Record<string, unknown>>('SELECT * FROM organisations');
    expect(organisations).toEqual([
      expect.objectContaining({
        subdomain: 'pokusnik',
        status: 'pending',
        legal_name: SIGNUP.legalName,
        ico: '12345679',
        vat_id: null,
        address: SIGNUP.address,
        statutory_representative: 'Jana Testovací',
        contact_email: SIGNUP.contactEmail,
        contact_phone: SIGNUP.contactPhone,
        billing_email: SIGNUP.billingEmail,
        display_name: 'Letní tábor Pokusník',
      }),
    ]);
    const organisationId = organisations[0]?.id;
    expect(await query('SELECT organisation_id FROM organisation_keys')).toEqual([{ organisation_id: organisationId }]);
    expect(await query('SELECT organisation_id, name, slug FROM camps')).toEqual([
      { organisation_id: organisationId, name: 'Letní tábor Pokusník', slug: 'letni-tabor-pokusnik' },
    ]);

    const admins = await query<{ id: string; email: string; password_hash: string }>('SELECT * FROM admins');
    expect(admins).toEqual([
      {
        id: expect.any(String),
        email: 'jana.testovaci@example.com',
        password_hash: expect.stringMatching(/^\$argon2id\$/),
      },
    ]);
    expect(admins[0]?.password_hash).not.toContain(SIGNUP.password);
    expect(await query('SELECT organisation_id, admin_id, owner FROM memberships')).toEqual([
      { organisation_id: organisationId, admin_id: admins[0]?.id, owner: true },
    ]);
  });

  it('signs the Owner in, who sees the Organisation waiting for approval', async () => {
    const response = await signUp();

    const account = await http()
      .get('/api/account')
      .set({ Host: mainHost(app()), Cookie: sessionCookie(response.headers['set-cookie']) });

    expect(account.status).toBe(200);
    expect(account.body).toEqual({
      email: 'jana.testovaci@example.com',
      memberships: [
        {
          owner: true,
          organisation: {
            id: expect.any(String),
            displayName: 'Letní tábor Pokusník',
            subdomain: 'pokusnik',
            status: 'pending',
          },
        },
      ],
    });
  });

  it('records the accepted versions of the terms and the data processing agreement, with time and user', async () => {
    clock().set(new Date('2026-11-02T09:30:00Z'));

    await signUp();

    const [admin] = await query<{ id: string }>('SELECT id FROM admins');
    const acceptances = await query(
      'SELECT document, version, accepted_at, accepted_by FROM legal_acceptances ORDER BY document',
    );
    expect(acceptances).toEqual([
      {
        document: 'terms',
        version: CURRENT_LEGAL_VERSIONS.terms,
        accepted_at: new Date('2026-11-02T09:30:00Z'),
        accepted_by: admin?.id,
      },
      {
        document: 'data_processing_agreement',
        version: CURRENT_LEGAL_VERSIONS.data_processing_agreement,
        accepted_at: new Date('2026-11-02T09:30:00Z'),
        accepted_by: admin?.id,
      },
    ]);
  });

  it("writes the Organisation, its Camp, the Owner and what they accepted to the Organisation's audit log", async () => {
    await signUp();

    const [admin] = await query<{ id: string }>('SELECT id FROM admins');
    const entries = await query('SELECT actor_kind, actor_identity, action FROM audit_entries ORDER BY action');
    expect(entries).toEqual(
      [
        'admin.create',
        'camp.create',
        'legal_acceptance.create',
        'legal_acceptance.create',
        'membership.create',
        'organisation.create',
      ].map((action) => ({
        actor_kind: 'admin',
        actor_identity: admin?.id,
        action,
      })),
    );
    expect(JSON.stringify(await query('SELECT changes FROM audit_entries'))).not.toMatch(/argon2|password/i);
  });

  it('notifies the Platform operator by email', async () => {
    await signUp({ vatId: 'cz12345679' });

    expect(mail().sent).toEqual([]);
    await jobs().drain();

    expect(mail().sent).toHaveLength(1);
    const [sent] = mail().sent;
    expect(sent).toMatchObject({
      from: '"Campie" <info@posta.campie.test>',
      to: ['operator@example.com'],
      subject: 'Nová organizace čeká na schválení: Testovací tábornický spolek z. s.',
    });
    for (const shown of ['12345679', 'CZ12345679', 'pokusnik.campie.test', 'Jana Testovací', SIGNUP.contactEmail]) {
      expect(sent?.text).toContain(shown);
    }
  });

  it.each([
    { subdomain: 'Tábor Pokus', status: 400, code: 'subdomain_malformed' },
    { subdomain: '-pokus', status: 400, code: 'subdomain_malformed' },
    { subdomain: 'www', status: 400, code: 'subdomain_reserved' },
    { subdomain: 'campie', status: 400, code: 'subdomain_reserved' },
    { subdomain: 'zabrany', status: 409, code: 'subdomain_taken' },
  ])('rejects the subdomain $subdomain as $code, creating nothing', async ({ subdomain, status, code }) => {
    await createOrganisation(app(), { subdomain: 'zabrany' });

    const response = await signUp({ subdomain });

    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ code });
    expect(response.headers['set-cookie']).toBeUndefined();
    await expectNothingCreated();
  });

  it('takes a subdomain typed in capitals and with spaces around it, lowercased', async () => {
    expect((await signUp({ subdomain: ' Pokusnik ' })).status).toBe(204);

    expect(await query('SELECT subdomain FROM organisations')).toEqual([{ subdomain: 'pokusnik' }]);
  });

  it.each([
    { race: 'subdomain', second: { email: 'petr.testovaci@example.com' }, code: 'subdomain_taken' },
    { race: 'email', second: { subdomain: 'druhy-pokus' }, code: 'email_taken' },
  ])(
    'lets only one of two simultaneous signups for one $race through, refusing the other with its code',
    async ({ second, code }) => {
      const responses = await Promise.all([signUp(), signUp(second)]);

      expect(responses.map((response) => response.status).sort((a, b) => a - b)).toEqual([204, 409]);
      expect(responses.find((response) => response.status === 409)?.body).toMatchObject({ code });
      expect(await query('SELECT id FROM organisations')).toHaveLength(1);
    },
  );

  it('rejects an email that already has an admin account', async () => {
    await signUp();

    const response = await signUp({ subdomain: 'druhy-pokus', email: 'jana.testovaci@example.com' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: 'email_taken' });
    expect(await query('SELECT subdomain FROM organisations')).toEqual([{ subdomain: 'pokusnik' }]);
  });

  it('rejects versions of the terms or the agreement other than the current ones', async () => {
    const response = await signUp({ acceptedVersions: { ...CURRENT_LEGAL_VERSIONS, terms: 'old' } });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: 'legal_versions_outdated' });
    await expectNothingCreated();
  });

  it.each([{ ico: '12345678' }, { password: 'kratke' }, { contactEmail: 'neni-email' }])(
    'rejects an invalid body (%o) before anything is created',
    async (body) => {
      expect((await signUp(body)).status).toBe(400);

      await expectNothingCreated();
    },
  );

  async function expectNothingCreated(): Promise<void> {
    expect(await query("SELECT subdomain FROM organisations WHERE subdomain <> 'zabrany'")).toEqual([]);
    expect(await query('SELECT id FROM admins')).toEqual([]);
    await jobs().drain();
    expect(mail().sent).toEqual([]);
  }
});
