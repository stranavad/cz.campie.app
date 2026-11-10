import { beforeEach, describe, expect, it } from 'vitest';

import {
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

describe("a guardian's Invoice request in the portal", () => {
  const { app, http, clock, database, expectIsolated } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let asJana: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const save = (body: object, headers = asJana) =>
    http().put(`/api/portal/registrations/${registrationId}/invoice-request`).set(headers).send(body);
  const remove = (headers = asJana) =>
    http().delete(`/api/portal/registrations/${registrationId}/invoice-request`).set(headers);
  const portal = (headers = asJana) => http().get(`/api/portal/registrations/${registrationId}`).set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    await offerInvoiceRequests(app(), organisationId, campId);
    // One child at 6 500.
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;
  });

  it('adds, changes and removes it, each audited as the guardian, the portal asking for the rest only', async () => {
    const added = await save(FAKE_INVOICE_REQUEST);

    expect(added.status).toBe(200);
    expect(added.body).toMatchObject({ companyName: 'Fiktivní firma s.r.o.', amount: 6000, invoicedOn: null });
    expect((await portal()).body).toMatchObject({
      camp: { invoiceRequests: true },
      invoiceRequest: { ico: '12345679', amount: 6000 },
      payment: { amount: 500, invoiced: { companyName: 'Fiktivní firma s.r.o.', amount: 6000 } },
    });

    expect((await save({ ...FAKE_INVOICE_REQUEST, amount: 6500, note: '' })).body).toMatchObject({
      amount: 6500,
      note: null,
    });
    expect((await remove()).status).toBe(204);
    expect((await portal()).body).toMatchObject({ invoiceRequest: null, payment: { amount: 6500, invoiced: null } });

    expect(
      await query(
        `SELECT action, actor_kind, actor_identity, changes->'amount' AS amount
           FROM audit_entries WHERE action LIKE 'invoice_request.%' ORDER BY id`,
      ),
    ).toEqual([
      {
        action: 'invoice_request.create',
        actor_kind: 'guardian',
        actor_identity: JANA,
        amount: { old: null, new: 6000 },
      },
      {
        action: 'invoice_request.update',
        actor_kind: 'guardian',
        actor_identity: JANA,
        amount: { old: 6000, new: 6500 },
      },
      {
        action: 'invoice_request.remove',
        actor_kind: 'guardian',
        actor_identity: JANA,
        amount: { old: 6500, new: null },
      },
    ]);
  });

  it('refuses more than the total now, and anything while the Camp does not offer it', async () => {
    const tooMuch = await save({ ...FAKE_INVOICE_REQUEST, amount: 6501 });

    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.fields).toEqual([
      { path: ['amount'], code: 'invoice_amount_above_total', params: { max: 6500 } },
    ]);

    await offerInvoiceRequests(app(), organisationId, campId, false);
    const unavailable = await save(FAKE_INVOICE_REQUEST);

    expect(unavailable.status).toBe(409);
    expect(unavailable.body.code).toBe('invoice_request_unavailable');
    expect(await query('SELECT id FROM invoice_requests')).toEqual([]);
  });

  it('keeps an existing one changeable after the Camp stops offering new ones', async () => {
    await save(FAKE_INVOICE_REQUEST);
    await offerInvoiceRequests(app(), organisationId, campId, false);

    expect((await save({ ...FAKE_INVOICE_REQUEST, amount: 5000 })).body).toMatchObject({ amount: 5000 });
    expect((await portal()).body).toMatchObject({ camp: { invoiceRequests: false }, invoiceRequest: { amount: 5000 } });
  });

  it('is read-only once the camp has invoiced it', async () => {
    await save(FAKE_INVOICE_REQUEST);
    await query(`UPDATE invoice_requests SET invoiced_on = '2027-04-12', invoice_number = 'FV-2027-001'`);

    const changed = await save({ ...FAKE_INVOICE_REQUEST, amount: 100 });
    const removed = await remove();

    expect([changed.status, changed.body.code]).toEqual([409, 'invoice_request_invoiced']);
    expect([removed.status, removed.body.code]).toEqual([409, 'invoice_request_invoiced']);
    expect((await portal()).body.invoiceRequest).toMatchObject({
      amount: 6000,
      invoicedOn: '2027-04-12',
      invoiceNumber: 'FV-2027-001',
    });
  });

  it("keeps another family and another Organisation's guardians away", async () => {
    await save(FAKE_INVOICE_REQUEST);
    const asOther = (await createGuardianSession(app(), organisationId, 'jiny.rodic@example.com')).headers;

    expect((await save({ ...FAKE_INVOICE_REQUEST, amount: 1 }, asOther)).status).toBe(404);
    expect((await remove(asOther)).status).toBe(404);

    const otherId = await createOrganisation(app());
    const asJanaElsewhere = (await createGuardianSession(app(), otherId, JANA)).headers;

    await expectIsolated(() => save({ ...FAKE_INVOICE_REQUEST, amount: 1 }, asJanaElsewhere));
    await expectIsolated(() => remove(asJanaElsewhere));
  });
});
