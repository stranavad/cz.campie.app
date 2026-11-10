import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  FAKE_INVOICE_REQUEST,
  offerInvoiceRequests,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const JANA = 'jana.testovaci@example.com';
const INVOICE = Buffer.from('%PDF-1.7 faktura FV-2027-7');
const CORRECTION = Buffer.from('%PDF-1.7 opravný daňový doklad');
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
// What an admin saves: the guardian's billing details and the camp's state.
const ADMIN_BODY = { ...FAKE_INVOICE_REQUEST, invoicedOn: null, invoiceNumber: null };

describe("an admin's Invoice requests and invoice files", () => {
  const { app, http, clock, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const path = () => `/api/registrations/${registrationId}/invoice-request`;
  const save = (body: object, headers = owner) => http().put(path()).set(headers).send(body);
  const remove = (headers = owner) => http().delete(path()).set(headers);
  const upload = (bytes = INVOICE, name = 'faktura.pdf', headers = owner) =>
    http().post(`${path()}/files`).set(headers).attach('file', bytes, name);
  const detail = async () => (await http().get(`/api/registrations/${registrationId}`).set(owner)).body;

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    // The Camp does not offer Invoice requests: an admin adds one regardless.
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    // One child at 6 500.
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
  });

  it('creates, edits, marks invoiced and removes one, any amount from zero, each change audited', async () => {
    expect((await save({ ...ADMIN_BODY, amount: 0 })).body).toMatchObject({ amount: 0, invoicedOn: null });
    expect((await save({ ...ADMIN_BODY, amount: 9000, city: 'Brno' })).body).toMatchObject({
      amount: 9000,
      city: 'Brno',
    });
    expect(
      (await save({ ...ADMIN_BODY, amount: 9000, invoicedOn: '2027-04-09', invoiceNumber: 'FV-2027-7' })).body,
    ).toMatchObject({ invoicedOn: '2027-04-09', invoiceNumber: 'FV-2027-7' });
    expect(await detail()).toMatchObject({
      invoiceRequest: { companyName: 'Fiktivní firma s.r.o.', amount: 9000, invoicedOn: '2027-04-09' },
      invoiceFiles: [],
      ledger: { company: { invoiced: 9000, balance: 9000 } },
    });

    expect((await remove()).status).toBe(204);
    expect((await detail()).invoiceRequest).toBeNull();
    expect((await remove()).status).toBe(404);

    expect(
      await query(
        `SELECT action, actor_kind, changes->'amount' AS amount FROM audit_entries
         WHERE action LIKE 'invoice_request.%' ORDER BY id`,
      ),
    ).toEqual([
      { action: 'invoice_request.create', actor_kind: 'admin', amount: { old: null, new: 0 } },
      { action: 'invoice_request.update', actor_kind: 'admin', amount: { old: 0, new: 9000 } },
      { action: 'invoice_request.update', actor_kind: 'admin', amount: null },
      { action: 'invoice_request.remove', actor_kind: 'admin', amount: { old: 9000, new: null } },
    ]);
  });

  it('adds every PDF uploaded, marks it invoiced with the first only, and never removes one', async () => {
    expect((await upload()).status).toBe(404);
    await save(ADMIN_BODY);

    const first = await upload();
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ name: 'faktura.pdf', uploadedAt: '2027-04-10T10:00:00.000Z' });
    expect((await detail()).invoiceRequest.invoicedOn).toBe('2027-04-10');

    clock().set(new Date('2027-05-02T10:00:00Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    expect((await upload(CORRECTION, 'opravny-doklad.pdf')).status).toBe(201);
    expect((await upload(PNG, 'faktura.png')).body).toMatchObject({ code: 'file_type_not_allowed' });

    const shown = await detail();
    expect(shown.invoiceRequest.invoicedOn).toBe('2027-04-10');
    expect(shown.invoiceFiles.map(({ name }: { name: string }) => name)).toEqual(['faktura.pdf', 'opravny-doklad.pdf']);
    expect((await http().get(shown.invoiceFiles[1].file.url)).body.toString()).toBe(CORRECTION.toString());

    expect((await remove()).body).toMatchObject({ code: 'invoice_request_has_files' });
    expect((await http().delete(`${path()}/files/${shown.invoiceFiles[0].id}`).set(owner)).status).toBe(404);
    expect(await query('SELECT FROM invoice_files')).toHaveLength(2);
    await expect(withClient(database().appUrl, (client) => client.query('DELETE FROM invoice_files'))).rejects.toThrow(
      /permission denied/,
    );

    expect(
      await query(
        `SELECT action, changes->'invoicedOn' AS invoiced_on FROM audit_entries
         WHERE action IN ('invoice_file.create', 'invoice_request.update') ORDER BY id`,
      ),
    ).toEqual([
      { action: 'invoice_file.create', invoiced_on: null },
      { action: 'invoice_request.update', invoiced_on: { old: null, new: '2027-04-10' } },
      { action: 'invoice_file.create', invoiced_on: null },
    ]);

    // A date the camp cleared stays cleared: only the first invoice sets it.
    await save(ADMIN_BODY);
    await upload(CORRECTION, 'druhy-opravny-doklad.pdf');
    expect((await detail()).invoiceRequest.invoicedOn).toBeNull();
  });

  it("lets the guardian download every file, and keeps another family's and Organisation's away", async () => {
    await save(ADMIN_BODY);
    await upload();
    await upload(CORRECTION, 'opravny-doklad.pdf');
    const portal = (headers: RequestHeaders) => http().get(`/api/portal/registrations/${registrationId}`).set(headers);
    const jana = (await createGuardianSession(app(), organisationId, JANA)).headers;

    const { invoiceFiles } = (await portal(jana)).body;
    expect(invoiceFiles).toMatchObject([
      { name: 'faktura.pdf', uploadedAt: '2027-04-10T10:00:00.000Z' },
      { name: 'opravny-doklad.pdf' },
    ]);
    expect((await http().get(invoiceFiles[0].file.url)).body.toString()).toBe(INVOICE.toString());

    // An uploaded invoice keeps it the camp's, even with the date cleared.
    await save(ADMIN_BODY);
    expect(
      (await http().delete(`/api/portal/registrations/${registrationId}/invoice-request`).set(jana)).body,
    ).toMatchObject({ code: 'invoice_request_invoiced' });

    const otherFamily = (await createGuardianSession(app(), organisationId, 'cizi.rodic@example.com')).headers;
    expect((await portal(otherFamily)).status).toBe(404);
    const otherId = await createOrganisation(app());
    expect((await portal((await createGuardianSession(app(), otherId, JANA)).headers)).status).toBe(404);
  });

  it('shows the invoice state in the list and filters by it', async () => {
    const [{ turnusId }] = await query<{ turnusId: string }>('SELECT turnus_id AS "turnusId" FROM registrations');
    const child = (lastName: string) => ({
      turnusId,
      children: [{ firstName: 'Dítě', lastName, birthDate: '2016-05-01' }],
    });
    const invoiced = (await submitRegistration(app(), organisationId, campId, child('Fakturované'))).id;
    const companyPaid = (await submitRegistration(app(), organisationId, campId, child('Zaplacené'))).id;
    await submitRegistration(app(), organisationId, campId, child('Bezfaktury'));
    await save(ADMIN_BODY);
    registrationId = invoiced;
    await save({ ...ADMIN_BODY, invoicedOn: '2027-04-10' });
    registrationId = companyPaid;
    await save({ ...ADMIN_BODY, invoicedOn: '2027-04-10' });
    await http()
      .post(`/api/registrations/${companyPaid}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 6000, paidOn: '2027-04-10', note: '', payer: 'company' });
    const list = async (invoice?: string) =>
      (
        (
          await http()
            .get(`/api/turnusy/${turnusId}/participants`)
            .query(invoice === undefined ? {} : { invoice })
            .set(owner)
        ).body as { lastName: string; invoice: object | null }[]
      ).map(({ lastName }) => lastName);

    expect(
      ((await http().get(`/api/turnusy/${turnusId}/participants`).set(owner)).body as object[]).map(
        ({ lastName, invoice }: { lastName?: string; invoice?: object }) => [lastName, invoice],
      ),
    ).toEqual([
      ['Bezfaktury', null],
      ['Fakturované', { state: 'invoiced', companyBalance: 6000 }],
      ['Testovací', { state: 'to_invoice', companyBalance: 6000 }],
      ['Zaplacené', { state: 'invoiced', companyBalance: 0 }],
    ]);
    expect(await list('none')).toEqual(['Bezfaktury']);
    expect(await list('to_invoice')).toEqual(['Testovací']);
    expect(await list('invoiced')).toEqual(['Fakturované', 'Zaplacené']);
    expect(await list('company_open')).toEqual(['Fakturované', 'Testovací']);
  });

  it("names the company and amount in the Camp's new Registration email", async () => {
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ notificationEmails: ['hlavni@tabor.example.com'] });
    await offerInvoiceRequests(app(), organisationId, campId);
    await jobs().drain();
    mail().sent.length = 0;

    await submitRegistration(app(), organisationId, campId, { invoiceRequest: FAKE_INVOICE_REQUEST });
    await jobs().drain();

    const [toTeam] = mail().sent.filter(({ to }) => to.includes('hlavni@tabor.example.com'));
    expect(toTeam?.text).toMatch(/Žádost o fakturu: Fiktivní firma s\.r\.o\., 6\s000\sKč/u);
  });

  it('takes Registrations write to change, and keeps another Organisation away', async () => {
    await save(ADMIN_BODY);
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    const reader = (
      await createAdmin(app(), { memberOf: [organisationId], permissions: { registrations: 'read' } })
    ).headers(organisationId);
    expect((await http().get(`/api/registrations/${registrationId}`).set(reader)).body).toMatchObject({
      invoiceRequest: { companyName: 'Fiktivní firma s.r.o.' },
      invoiceFiles: [],
    });

    await expectPermission(['registrations', 'write'], organisationId, (headers) => save(ADMIN_BODY, headers));
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      upload(INVOICE, 'faktura.pdf', headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) => remove(headers));

    await expectIsolated(() => save(ADMIN_BODY, asOther));
    await expectIsolated(() => upload(INVOICE, 'faktura.pdf', asOther));
    await expectIsolated(() => remove(asOther));
  });
});
