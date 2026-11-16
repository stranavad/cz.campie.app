import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createCamp, createOrganisation, OPEN_TURNUS } from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('setup progress', () => {
  const { app, http, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const progress = async (admin = owner, of = organisationId) =>
    (await http().get('/api/setup-progress').set(admin.headers(of)).expect(200)).body as unknown;

  const setBankAccount = (admin = owner, of = organisationId) =>
    http()
      .patch('/api/organisation-settings')
      .set(admin.headers(of))
      .send({ bankAccount: '35-1000000005/0300' })
      .expect(200);

  const addTurnus = (to = campId, admin = owner, of = organisationId) =>
    http().post(`/api/camps/${to}/turnusy`).set(admin.headers(of)).send(OPEN_TURNUS).expect(201);

  const publishForm = (campOf = campId, admin = owner, of = organisationId) =>
    http().post(`/api/camps/${campOf}/registration-form/versions`).set(admin.headers(of)).expect(201);

  it('turns each step, and only that one, as the Organisation gains what it stands for', async () => {
    expect(await progress()).toEqual({ bankAccount: false, campId, turnus: false, registrationForm: false });

    await setBankAccount();
    expect(await progress()).toEqual({ bankAccount: true, campId, turnus: false, registrationForm: false });

    await addTurnus();
    expect(await progress()).toEqual({ bankAccount: true, campId, turnus: true, registrationForm: false });

    await publishForm();
    expect(await progress()).toEqual({ bankAccount: true, campId, turnus: true, registrationForm: true });
  });

  it('describes one Camp, the one closest to taking Registrations', async () => {
    const laterCampId = await createCamp(app(), organisationId, 'Zimní tábor');

    // A Turnus here and a form there take no Registration: the older Camp is named, half done.
    await addTurnus(campId);
    await publishForm(laterCampId);
    expect(await progress()).toEqual({ bankAccount: false, campId, turnus: true, registrationForm: false });

    await addTurnus(laterCampId);
    expect(await progress()).toEqual({
      bankAccount: false,
      campId: laterCampId,
      turnus: true,
      registrationForm: true,
    });
  });

  it('names no Camp for an Organisation without one', async () => {
    const emptyId = await createOrganisation(app());
    const emptyOwner = await createAdmin(app(), { memberOf: [emptyId], owner: true });

    expect(await progress(emptyOwner, emptyId)).toEqual({
      bankAccount: false,
      campId: null,
      turnus: false,
      registrationForm: false,
    });
  });

  it('needs Camp settings read', async () => {
    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get('/api/setup-progress').set(headers),
    );
  });

  it("never reflects another Organisation's bank account, Turnusy or forms", async () => {
    const otherId = await createOrganisation(app());
    const otherCampId = await createCamp(app(), otherId, 'Cizí tábor');
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await setBankAccount();
    await addTurnus();
    await publishForm();

    expect(await progress(otherOwner, otherId)).toEqual({
      bankAccount: false,
      campId: otherCampId,
      turnus: false,
      registrationForm: false,
    });
  });
});
