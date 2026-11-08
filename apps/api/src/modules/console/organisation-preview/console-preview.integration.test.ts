import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  signIn,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Pokusov',
  capacity: 30,
  minAge: null,
  maxAge: null,
  opensAt: '2027-05-01T08:00',
  closesAt: null,
  closedManually: false,
  websiteUrl: null,
  basePrice: 6500,
  earlyBirdPrice: null,
  earlyBirdLastDay: null,
  deposit: null,
  depositDueDays: 14,
  balanceDueDate: null,
};

describe("the operator's preview of a pending Organisation", () => {
  const testApp = useTestApp();
  const { app, http, clock } = testApp;

  let pendingId: string;
  let owner: RequestHeaders;
  let operator: Awaited<ReturnType<typeof createOperator>>;

  const preview = (organisationId: string, headers: RequestHeaders = operator.headers) =>
    http().get(`/api/console/organisations/${organisationId}/preview`).set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    pendingId = await createOrganisation(app(), { status: 'pending' });
    const campId = await createCamp(app(), pendingId, 'Tábor v přípravě', 'v-priprave');
    owner = (await createAdmin(app(), { memberOf: [pendingId], owner: true })).headers(pendingId);
    await http().post(`/api/camps/${campId}/turnusy`).set(owner).send(TURNUS);
    operator = await createOperator(testApp);
  });

  it("shows the operator each Camp's public page with its Turnusy, and nothing beyond them", async () => {
    const response = await preview(pendingId);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      camps: [
        {
          camp: { name: 'Tábor v přípravě', slug: 'v-priprave' },
          turnusy: [{ name: 'Turnus 1', remainingPlaces: 30 }],
        },
      ],
    });
    expect(JSON.stringify(response.body)).not.toContain('capacity');
  });

  it('previews only an Organisation awaiting approval, for the operator after the second step only', async () => {
    const approvedId = await createOrganisation(app());

    expect((await preview(approvedId)).body).toMatchObject({ code: 'organisation_unknown' });
    expect((await preview('01900000-0000-7000-8000-000000000000')).status).toBe(404);
    expect((await preview(pendingId, owner)).body).toMatchObject({ code: 'not_operator' });
    expect((await preview(pendingId, await signIn(app(), operator.id))).body).toMatchObject({
      code: 'second_factor_required',
    });
    expect(
      (await preview(pendingId, { ...operator.headers, Host: await organisationHost(app(), approvedId) })).status,
    ).toBe(404);
  });

  it("leaves the Organisation's admin routes closed to the operator without a support grant", async () => {
    await preview(pendingId);

    const camps = await http()
      .get('/api/camps')
      .set({ ...operator.headers, 'x-organisation-id': pendingId });

    expect(camps.status).toBe(403);
  });
});
