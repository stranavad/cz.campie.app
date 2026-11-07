import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createOrganisation, organisationHost, type RequestHeaders } from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { useTestApp } from '../../../testing/test-app.ts';

describe('feedback and problem reports', () => {
  const testApp = useTestApp();
  const { app, http, jobs, mail } = testApp;

  let organisationId: string;
  let owner: RequestHeaders;
  let operator: RequestHeaders;

  const reports = async () => (await http().get('/api/console/problem-reports').set(operator)).body as object[];

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { displayName: 'Tábor Pokusník' });
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    operator = (await createOperator(testApp)).headers;
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('brings an admin report to the console with the Organisation, admin and page, and emails the operator', async () => {
    expect(
      (
        await http()
          .post('/api/feedback')
          .set(owner)
          .send({ pageUrl: 'https://app.example.test/platform/prihlasky', text: 'Export trvá dlouho.' })
      ).status,
    ).toBe(204);
    await jobs().drain();

    expect(await reports()).toEqual([
      expect.objectContaining({
        kind: 'admin',
        organisation: { id: organisationId, displayName: 'Tábor Pokusník' },
        from: expect.stringMatching(/@example\.com$/),
        pageUrl: 'https://app.example.test/platform/prihlasky',
        text: 'Export trvá dlouho.',
        resolvedAt: null,
      }),
    ]);
    expect(mail().sent.map(({ subject }) => subject)).toEqual(['Zpětná vazba od správce: Tábor Pokusník']);
  });

  it('takes a guardian technical problem on the subdomain with only what was typed', async () => {
    const host = { Host: await organisationHost(app(), organisationId) };

    await http()
      .post('/api/problem-reports')
      .set(host)
      .set('x-csrf-protection', '1')
      .send({ pageUrl: '/portal', text: 'Nejde mi nahrát dokument.', email: '' });

    expect(await reports()).toEqual([
      expect.objectContaining({ kind: 'guardian', from: null, pageUrl: '/portal', text: 'Nejde mi nahrát dokument.' }),
    ]);
  });

  it('lets the operator mark a report dealt with, and nobody else read them', async () => {
    await http().post('/api/feedback').set(owner).send({ pageUrl: '/', text: 'Děkujeme za aplikaci.' });
    const [report] = (await reports()) as { id: string }[];

    expect(
      (await http().post(`/api/console/problem-reports/${report?.id}/resolve`).set(operator)).body.resolvedAt,
    ).toEqual(expect.any(String));
    expect((await http().get('/api/console/problem-reports').set(owner)).status).toBe(403);
  });
});

describe('problem reports, limited', () => {
  const { app, http } = useTestApp({ env: { PROBLEM_REPORT_LIMIT_PER_IP: '2' } });

  it('refuses more reports from one address than the limit', async () => {
    const organisationId = await createOrganisation(app());
    const host = { Host: await organisationHost(app(), organisationId) };
    const send = () =>
      http()
        .post('/api/problem-reports')
        .set(host)
        .set('x-csrf-protection', '1')
        .send({ pageUrl: '/', text: 'Stránka nejde načíst.' });

    expect((await send()).status).toBe(204);
    expect((await send()).status).toBe(204);
    expect((await send()).status).toBe(429);
  });
});
