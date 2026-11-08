import { describe, expect, it } from 'vitest';

import { auditChangesOf, type AuditTexts } from './audit-changes.ts';

// The app's translations stand in as their keys, so a row shows which text it asked for.
const text: AuditTexts = {
  field: (label) => `[fields.${label}]`,
  value: (set, value) => `[values.${set}.${value}]`,
  yesNo: (value) => (value ? '[yes]' : '[no]'),
};

describe('auditChangesOf', () => {
  it('writes money, booleans, dates, instants and enum values as Czech readers read them', () => {
    const { rows } = auditChangesOf(
      'turnus.update',
      {
        basePrice: { old: 6500, new: 4500 },
        closedManually: { old: false, new: true },
        startDate: { old: '2027-07-04', new: '2027-07-01' },
        opensAt: { old: null, new: '2027-03-28T08:00:00.000Z' },
      },
      text,
    );

    expect(rows).toEqual([
      { field: 'basePrice', label: '[fields.basePrice]', old: '6\u00a0500 Kč', new: '4\u00a0500 Kč' },
      { field: 'closedManually', label: '[fields.closedManually]', old: '[no]', new: '[yes]' },
      { field: 'startDate', label: '[fields.startDate]', old: '4. 7. 2027', new: '1. 7. 2027' },
      { field: 'opensAt', label: '[fields.opensAt]', old: '-', new: '28. 3. 2027 10:00' },
    ]);
  });

  it('names enum values and list items by their translations, the same field by its record', () => {
    const participant = auditChangesOf('participant.cancel', { status: { old: 'registered', new: 'cancelled' } }, text);
    const upload = auditChangesOf('document_upload.return', { status: { old: 'pending', new: 'returned' } }, text);
    const camp = auditChangesOf(
      'camp.update',
      { modules: { old: [], new: ['consents', 'documents'] }, notificationEmails: { old: [], new: ['a@example.com'] } },
      text,
    );

    expect(participant.rows).toEqual([
      {
        field: 'status',
        label: '[fields.participantStatus]',
        old: '[values.participantStatus.registered]',
        new: '[values.participantStatus.cancelled]',
      },
    ]);
    expect(upload.rows[0]).toMatchObject({
      old: '[values.uploadStatus.pending]',
      new: '[values.uploadStatus.returned]',
    });
    expect(camp.rows).toEqual([
      {
        field: 'modules',
        label: '[fields.modules]',
        old: '-',
        new: '[values.campModule.consents], [values.campModule.documents]',
      },
      { field: 'notificationEmails', label: '[fields.notificationEmails]', old: '-', new: 'a@example.com' },
    ]);
  });

  it('lists only the new values of a created record and only the old values of a removed one', () => {
    const created = auditChangesOf(
      'camp.create',
      { name: { old: null, new: 'Letní tábor' }, siblingDiscountAmount: { old: null, new: 0 } },
      text,
    );
    const removed = auditChangesOf('discount_code.remove', { code: { old: 'LETO', new: null } }, text);
    const submitted = auditChangesOf('registration.submit', { depositTotal: { old: null, new: 2000 } }, text);

    expect(created.rows).toEqual([
      { field: 'name', label: '[fields.name]', new: 'Letní tábor' },
      { field: 'siblingDiscountAmount', label: '[fields.siblingDiscountAmount]', new: '0 Kč' },
    ]);
    expect(removed.rows).toEqual([{ field: 'code', label: '[fields.code]', old: 'LETO' }]);
    expect(submitted.rows).toEqual([{ field: 'depositTotal', label: '[fields.depositTotal]', new: '2\u00a0000 Kč' }]);
  });

  it('keeps an update from nothing to a value two-sided, with a dash for the empty side', () => {
    const { rows } = auditChangesOf('camp.update', { contactEmail: { old: null, new: 'leto@example.com' } }, text);

    expect(rows).toEqual([
      { field: 'contactEmail', label: '[fields.contactEmail]', old: '-', new: 'leto@example.com' },
    ]);
  });

  it('leaves fields without a translation, and every field of an unknown action, for the details', () => {
    const known = auditChangesOf(
      'camp.update',
      { id: { old: null, new: '01900000-0000-7000-8000-0000000000a1' }, name: { old: 'Léto', new: 'Zima' } },
      text,
    );
    const unknown = auditChangesOf('note.update', { text: { old: 'a', new: 'b' } }, text);

    expect(known.rows.map(({ field }) => field)).toEqual(['name']);
    expect(known.untranslated).toEqual({ id: { old: null, new: '01900000-0000-7000-8000-0000000000a1' } });
    expect(unknown).toEqual({ rows: [], untranslated: { text: { old: 'a', new: 'b' } } });
  });

  it('names the people of a list by their names only, never by ids or raw dates', () => {
    const { rows } = auditChangesOf(
      'registration.submit',
      {
        guardians: {
          old: null,
          new: [{ firstName: 'Jana', lastName: 'Testovací', email: 'jana@example.com', phone: '+420 123 456 789' }],
        },
        participants: {
          old: null,
          new: [
            {
              id: '01900000-0000-7000-8000-0000000000a1',
              firstName: 'Ema',
              lastName: 'Testovací',
              birthDate: '2016-05-01',
            },
            { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-02-02' },
          ],
        },
      },
      text,
    );

    expect(rows).toEqual([
      { field: 'guardians', label: '[fields.guardians]', new: 'Jana Testovací' },
      { field: 'participants', label: '[fields.participants]', new: 'Ema Testovací, Jan Testovací' },
    ]);
  });

  it('leaves a change that reads the same on both sides for the details', () => {
    const participants = {
      old: [{ firstName: 'Ema', lastName: 'Testovací', answers: { shirt: 'S' } }],
      new: [{ firstName: 'Ema', lastName: 'Testovací', answers: { shirt: 'M' } }],
    };

    const { rows, untranslated } = auditChangesOf('registration.edit', { participants }, text);

    expect(rows).toEqual([]);
    expect(untranslated).toEqual({ participants });
  });

  it('reads an entry without changes, such as a scrubbed one, as no rows', () => {
    expect(auditChangesOf('registration.edit', null, text)).toEqual({ rows: [], untranslated: {} });
  });
});
