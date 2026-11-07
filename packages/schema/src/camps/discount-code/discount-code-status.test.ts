import { describe, expect, it } from 'vitest';

import { discountCodeStatus } from './discount-code-status.ts';

const CODE = { active: true, usageLimit: 2, expiresOn: '2027-03-31' };

// 1 April starts in Prague at 22:00 UTC on 31 March (summer time).
const LAST_EVENING = new Date('2027-03-31T21:59:59Z');
const NEXT_DAY = new Date('2027-03-31T22:00:00Z');

describe('discountCodeStatus', () => {
  it('is unknown for no code', () => {
    expect(discountCodeStatus(null, 0, LAST_EVENING)).toBe('unknown');
  });

  it('is valid through its expiry day in Prague, inclusive, and expired after', () => {
    expect(discountCodeStatus(CODE, 0, LAST_EVENING)).toBe('valid');
    expect(discountCodeStatus(CODE, 0, NEXT_DAY)).toBe('expired');
  });

  it('is exhausted once its uses reach the limit', () => {
    expect(discountCodeStatus(CODE, 1, LAST_EVENING)).toBe('valid');
    expect(discountCodeStatus(CODE, 2, LAST_EVENING)).toBe('exhausted');
  });

  it('is inactive when switched off, whatever else holds', () => {
    expect(discountCodeStatus({ ...CODE, active: false }, 5, NEXT_DAY)).toBe('inactive');
  });

  it('never expires or runs out without an expiry or a limit', () => {
    expect(discountCodeStatus({ active: true, usageLimit: null, expiresOn: null }, 10_000, NEXT_DAY)).toBe('valid');
  });
});
