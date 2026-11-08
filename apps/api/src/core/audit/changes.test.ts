import { describe, expect, it } from 'vitest';

import { changesBetween } from './changes.ts';

describe('changesBetween', () => {
  it('records a created row as every set field going from nothing to its value', () => {
    const created = {
      text: 'packing list',
      secret: Buffer.from([1, 2, 3]),
      note: null,
      stamp: new Date('2027-02-01T09:30:00Z'),
    };

    expect(changesBetween(null, created)).toEqual({
      values: {
        text: { old: null, new: 'packing list' },
        stamp: { old: null, new: '2027-02-01T09:30:00.000Z' },
      },
      encryptedFields: ['secret'],
    });
  });

  it('leaves out ids, foreign keys, the Organisation, timestamps and internal fields', () => {
    const created = {
      id: '01900000-0000-7000-8000-0000000000a1',
      organisationId: '01900000-0000-7000-8000-0000000000a2',
      campId: '01900000-0000-7000-8000-0000000000a3',
      createdAt: new Date('2027-02-01T09:30:00Z'),
      updatedAt: new Date('2027-02-01T09:30:00Z'),
      userAgent: 'Mozilla/5.0',
      merchantId: '123456',
      name: 'Letní tábor',
    };

    expect(changesBetween(null, created).values).toEqual({
      merchantId: { old: null, new: '123456' },
      name: { old: null, new: 'Letní tábor' },
    });
  });

  it('skips an instant or an encrypted value that did not change', () => {
    const before = { stamp: new Date('2027-02-01T09:30:00Z'), secret: Buffer.from([1, 2, 3]), count: 2 };
    const after = { stamp: new Date('2027-02-01T09:30:00Z'), secret: Buffer.from([1, 2, 3]), count: 3 };

    expect(changesBetween(before, after)).toEqual({ values: { count: { old: 2, new: 3 } }, encryptedFields: [] });
  });

  it('records a removed row as every field going from its value to nothing', () => {
    expect(changesBetween({ count: 2, secret: Buffer.from([1]) }, null)).toEqual({
      values: { count: { old: 2, new: null } },
      encryptedFields: ['secret'],
    });
  });
});
