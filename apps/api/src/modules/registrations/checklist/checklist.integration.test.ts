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

const INSURANCE = '0190a2b4-0000-7000-8000-0000000000ab';
const RULES = '0190a2b4-0000-7000-8000-0000000000ac';

describe('Participant checklist', () => {
  const { app, http, database, expectIsolated } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let registrationId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const checklist = (headers = guardian) =>
    http().get(`/api/portal/registrations/${registrationId}/checklist`).set(headers);
  const kinds = async () =>
    ((await checklist()).body.participants[0].items as { kind: string; state: string; done: boolean }[]).map(
      ({ kind, state, done }) => `${kind}:${state}:${done ? 'done' : 'open'}`,
    );

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true, documents: true } });
    await http()
      .post(`/api/camps/${campId}/consents`)
      .set(owner)
      .send({
        title: 'Táborový řád',
        introduction: '',
        items: [{ id: RULES, kind: 'must_agree', text: 'Souhlasím.' }],
        withdrawable: false,
        fileId: null,
      });
    await http()
      .post(`/api/camps/${campId}/document-types`)
      .set(owner)
      .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] });
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
  });

  it('lists payment, each Consent and each requirement for each child', async () => {
    expect(await kinds()).toEqual(['payment:open:open', 'consent:unsigned:open', 'document:missing:open']);
  });

  it('asks for answers to a required field the form added since', async () => {
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: {
          standard: [],
          custom: [
            {
              id: INSURANCE,
              type: 'short_text',
              label: 'Číslo pojištěnce',
              hint: null,
              required: true,
              scope: 'participant',
              health: false,
            },
          ],
        },
        maxParticipants: 3,
        declarations: [],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);

    expect(await kinds()).toContain('missing_answers:open:open');
  });

  it('counts an encrypted answer to a required health field added since as given', async () => {
    const allergies = {
      id: INSURANCE,
      type: 'short_text',
      label: 'Alergie',
      hint: null,
      required: true,
      scope: 'participant',
      health: true,
    };
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({ definition: { standard: [], custom: [allergies] }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
    expect(await kinds()).toContain('missing_answers:open:open');
    const participantId = (await query<{ id: string }>('SELECT id FROM participants'))[0]?.id;

    await http()
      .put(`/api/portal/registrations/${registrationId}/answers`)
      .set(guardian)
      .send({ registration: {}, participants: [{ participantId, answers: { [INSURANCE]: 'Pyl' } }] });

    expect(await query('SELECT answers FROM participants')).toEqual([{ answers: {} }]);
    expect(await kinds()).not.toContain('missing_answers:open:open');
  });

  it('gives a Cancelled child no checklist, and a guardian of another family nothing', async () => {
    const stranger = (await createGuardianSession(app(), organisationId, 'cizi.rodic@example.com')).headers;
    const otherId = await createOrganisation(app());
    const other = (await createGuardianSession(app(), otherId, 'jana.testovaci@example.com')).headers;

    expect((await checklist(stranger)).status).toBe(404);
    await expectIsolated(() => checklist(other));

    await query(`UPDATE participants SET status = 'cancelled' WHERE registration_id = $1`, [registrationId]);
    expect((await checklist()).body).toEqual({ participants: [] });
  });
});
