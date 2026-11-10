import { beforeEach, describe, expect, it } from 'vitest';

import type { PublicCampCard, TurnusBody } from '@repo/schema/camps';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  mainHost,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { PALETTE_PNG, RGBA_PNG } from '../../../testing/images.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Tábořiště Pokusov',
  capacity: 40,
  minAge: 7,
  maxAge: 15,
  opensAt: '2027-02-01T18:00',
  closesAt: '2027-06-01T00:00',
  closedManually: false,
  websiteUrl: '',
  basePrice: 6500,
  earlyBirdPrice: 5900,
  earlyBirdLastDay: '2027-03-31',
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

describe('public camp pages', () => {
  const { app, http, clock, expectIsolated } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Awaited<ReturnType<typeof createAdmin>>;
  let host: RequestHeaders;

  beforeEach(async () => {
    clock().set(new Date('2027-01-15T12:00:00Z'));
    organisationId = await createOrganisation(app(), { accentColour: '#1d3557' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    host = { Host: await organisationHost(app(), organisationId) };
    await http().post(`/api/camps/${campId}/turnusy`).set(owner.headers(organisationId)).send(TURNUS);
  });

  const turnusAt = async (instant: string) => {
    clock().set(new Date(instant));

    return (await http().get('/api/public-camps/letni-tabor/turnusy').set(host)).body[0];
  };

  it("lists the Organisation's Camps for its landing page, in their branding", async () => {
    await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');

    const response = await http().get('/api/public-camps').set(host);

    expect(response.body).toEqual([
      expect.objectContaining({ name: 'Letní tábor', slug: 'letni-tabor', accentColour: '#1d3557', logoUrl: null }),
      expect.objectContaining({ name: 'Zimní tábor', slug: 'zimni-tabor' }),
    ]);
  });

  it("sums up each Camp's Turnusy not yet over on its card: their dates and the lowest price open now", async () => {
    const addTurnus = (fields: Partial<TurnusBody>) =>
      http()
        .post(`/api/camps/${campId}/turnusy`)
        .set(owner.headers(organisationId))
        .send({ ...TURNUS, opensAt: null, closesAt: null, earlyBirdPrice: null, earlyBirdLastDay: null, ...fields });
    await addTurnus({ name: 'Srpen', startDate: '2027-08-01', endDate: '2027-08-14', basePrice: 6000 });
    // Over, though its window never closed: neither its dates nor its price count.
    await addTurnus({ name: 'Loni', startDate: '2026-07-01', endDate: '2026-07-14', basePrice: 3000 });
    // Closed by hand: its dates count, its price does not.
    await addTurnus({
      name: 'Září',
      startDate: '2027-09-01',
      endDate: '2027-09-10',
      basePrice: 4000,
      closedManually: true,
    });
    await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const cards = async (instant: string) => {
      clock().set(new Date(instant));

      return (await http().get('/api/public-camps').set(host)).body.map(
        ({ slug, dates, lowestPrice }: PublicCampCard) => ({
          slug,
          dates,
          lowestPrice,
        }),
      );
    };

    // The Early bird price of the Turnus not yet open is in force and the lowest.
    expect(await cards('2027-03-31T21:59:59Z')).toEqual([
      { slug: 'letni-tabor', dates: { startDate: '2027-07-04', endDate: '2027-09-10' }, lowestPrice: 5900 },
      { slug: 'zimni-tabor', dates: null, lowestPrice: null },
    ]);
    expect(await cards('2027-03-31T22:00:00Z')).toMatchObject([{ lowestPrice: 6000 }, {}]);
    // On the last day of the only Turnus left, closed by hand, it still counts until midnight in Prague.
    expect(await cards('2027-09-10T21:59:59Z')).toMatchObject([
      { dates: { startDate: '2027-09-01', endDate: '2027-09-10' }, lowestPrice: null },
      {},
    ]);
    expect(await cards('2027-09-10T22:00:00Z')).toMatchObject([{ dates: null, lowestPrice: null }, {}]);
  });

  it('shows the public Camp and its card with exactly the fields guardians may see', async () => {
    const fields = ['id', 'name', 'slug', 'websiteUrl', 'description', 'contactName', 'contactEmail', 'contactPhone'];
    const appearance = ['accentColour', 'logoUrl', 'photoUrl', 'cardPayments', 'invoiceRequests', 'siblingDiscount'];

    const camp = (await http().get('/api/public-camps/letni-tabor').set(host)).body;
    const [card] = (await http().get('/api/public-camps').set(host)).body;

    expect(Object.keys(camp).toSorted()).toEqual([...fields, ...appearance].toSorted());
    expect(Object.keys(card).toSorted()).toEqual([...fields, ...appearance, 'dates', 'lowestPrice'].toSorted());
  });

  it('shows a Turnus with the places left and the price in force, never its capacity internals', async () => {
    const turnus = await turnusAt('2027-03-31T21:59:59Z');

    expect(turnus).toEqual({
      id: expect.any(String),
      name: 'Turnus 1',
      startDate: '2027-07-04',
      endDate: '2027-07-17',
      place: 'Tábořiště Pokusov',
      minAge: 7,
      maxAge: 15,
      websiteUrl: null,
      basePrice: 6500,
      earlyBirdPrice: 5900,
      earlyBirdLastDay: '2027-03-31',
      priceNow: 5900,
      deposit: 2000,
      opensAt: '2027-02-01T17:00:00.000Z',
      closesAt: '2027-05-31T22:00:00.000Z',
      availability: 'open',
      remainingPlaces: 40,
    });
    expect((await turnusAt('2027-03-31T22:00:00Z')).priceNow).toBe(6500);
  });

  it('shows a Turnus without a Deposit with none', async () => {
    await http()
      .post(`/api/camps/${campId}/turnusy`)
      .set(owner.headers(organisationId))
      .send({ ...TURNUS, name: 'Turnus 2', startDate: '2027-08-01', endDate: '2027-08-14', deposit: 0 });

    const turnusy = (await http().get('/api/public-camps/letni-tabor/turnusy').set(host)).body;

    expect(turnusy).toMatchObject([
      { name: 'Turnus 1', deposit: 2000 },
      { name: 'Turnus 2', deposit: null },
    ]);
  });

  it('marks a Turnus not yet open, with its opening instant for the countdown, and closed after its window', async () => {
    expect(await turnusAt('2027-02-01T16:59:59Z')).toMatchObject({ availability: 'not_yet_open' });
    expect(await turnusAt('2027-05-31T22:00:00Z')).toMatchObject({ availability: 'closed_by_window' });
  });

  it("answers 404 for an unknown subdomain and for a pending Organisation's pages, to everyone", async () => {
    const pendingId = await createOrganisation(app(), { status: 'pending' });
    const pendingHost = { Host: await organisationHost(app(), pendingId) };

    expect(
      (
        await http()
          .get('/api/public-camps')
          .set({ Host: `neznamy.${mainHost(app()).slice(4)}` })
      ).status,
    ).toBe(404);
    expect((await http().get('/api/organisation').set(pendingHost)).body).toMatchObject({
      code: 'organisation_unknown',
    });
    expect((await http().get('/api/public-camps').set(pendingHost)).status).toBe(404);
  });

  it("takes a suspended Organisation's pages offline for everyone", async () => {
    const suspendedId = await createOrganisation(app(), { status: 'suspended' });

    const response = await http()
      .get('/api/public-camps')
      .set({ Host: await organisationHost(app(), suspendedId) });

    expect(response.body).toMatchObject({ code: 'organisation_suspended' });
  });

  it("lets a pending Organisation's admins preview a Camp's page from the main host", async () => {
    const pendingId = await createOrganisation(app(), { status: 'pending' });
    const pendingCampId = await createCamp(app(), pendingId, 'Tábor v přípravě', 'v-priprave');
    const member = await createAdmin(app(), { memberOf: [pendingId] });

    const response = await http().get(`/api/camps/${pendingCampId}/preview`).set(member.headers(pendingId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ camp: { name: 'Tábor v přípravě', slug: 'v-priprave' }, turnusy: [] });
  });

  it("shows no other Organisation's Camps or Turnusy on this subdomain", async () => {
    const otherId = await createOrganisation(app());
    await createCamp(app(), otherId, 'Cizí tábor', 'cizi-tabor');
    const otherHost = { Host: await organisationHost(app(), otherId) };

    // This Organisation's Turnus counts on none of the other's cards.
    expect((await http().get('/api/public-camps').set(otherHost)).body).toMatchObject([
      { slug: 'cizi-tabor', dates: null, lowestPrice: null },
    ]);
    await expectIsolated(() => http().get('/api/public-camps/letni-tabor/turnusy').set(otherHost));
  });

  it("previews a Camp's logo through a link that works on the main host", async () => {
    await http()
      .put(`/api/camps/${campId}/branding/logo`)
      .set(owner.headers(organisationId))
      .attach('file', RGBA_PNG, 'logo.png');

    const { logoUrl } = (await http().get(`/api/camps/${campId}/preview`).set(owner.headers(organisationId))).body.camp;
    const logo = await http()
      .get(logoUrl)
      .set({ Host: mainHost(app()) })
      .buffer(true);

    expect(logo.status).toBe(200);
    expect(logo.body).toEqual(RGBA_PNG);
  });

  it("previews a Camp's photo through a link that works on the main host", async () => {
    await http()
      .put(`/api/camps/${campId}/photo`)
      .set(owner.headers(organisationId))
      .attach('file', PALETTE_PNG, 'tabor.png');

    const { photoUrl } = (await http().get(`/api/camps/${campId}/preview`).set(owner.headers(organisationId))).body
      .camp;
    const photo = await http()
      .get(photoUrl)
      .set({ Host: mainHost(app()) })
      .buffer(true);

    expect(photoUrl).toMatch(/^\/api\/downloads\//);
    expect(photo.status).toBe(200);
    expect(photo.body).toEqual(PALETTE_PNG);
  });

  it("previews no other Organisation's Camp", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    expect((await http().get(`/api/camps/${campId}/preview`).set(otherOwner.headers(otherId))).status).toBe(404);
  });
});
