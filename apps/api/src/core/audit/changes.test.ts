import { describe, expect, it } from 'vitest';

import { changesBetween } from './changes.ts';

describe('changesBetween', () => {
  it('records a created row as every set field going from nothing to its value', () => {
    const created = {
      id: '01900000-0000-7000-8000-0000000000a1',
      text: 'packing list',
      secret: Buffer.from([1, 2, 3]),
      note: null,
      createdAt: new Date('2027-02-01T09:30:00Z'),
    };

    expect(changesBetween(null, created)).toEqual({
      values: {
        id: { old: null, new: '01900000-0000-7000-8000-0000000000a1' },
        text: { old: null, new: 'packing list' },
        createdAt: { old: null, new: '2027-02-01T09:30:00.000Z' },
      },
      encryptedFields: ['secret'],
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
