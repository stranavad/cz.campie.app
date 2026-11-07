import { describe, expect, it } from 'vitest';

import { czechDate, czechDateTime, czk } from './czech-format.ts';

describe('Czech formats', () => {
  it('writes a date without leading zeros', () => {
    expect(czechDate('2027-07-04')).toBe('4. 7. 2027');
  });

  it('writes an instant at its Prague time, summer time included', () => {
    expect(czechDateTime(new Date('2027-07-04T08:05:00Z'))).toBe('4. 7. 2027 10:05');
  });

  it('writes money with a non-breaking thousands space', () => {
    expect(czk(13_300)).toBe('13 300 Kč');
  });
});
