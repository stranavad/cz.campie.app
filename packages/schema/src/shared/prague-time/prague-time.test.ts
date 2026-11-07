import { describe, expect, it } from 'vitest';

import { addDays, instantFromPragueLocal, pragueDateOf, pragueLocalOf, pragueLocalSchema } from './prague-time.ts';

describe('pragueDateOf', () => {
  it('reads the calendar date in Prague, not in UTC, near midnight', () => {
    expect(pragueDateOf(new Date('2027-01-14T22:59:59Z'))).toBe('2027-01-14');
    expect(pragueDateOf(new Date('2027-01-14T23:00:00Z'))).toBe('2027-01-15');
    expect(pragueDateOf(new Date('2027-07-14T21:59:59Z'))).toBe('2027-07-14');
    expect(pragueDateOf(new Date('2027-07-14T22:00:00Z'))).toBe('2027-07-15');
  });
});

describe('instantFromPragueLocal', () => {
  it('reads a Prague wall-clock time in winter (UTC+1) and summer (UTC+2)', () => {
    expect(instantFromPragueLocal('2027-02-01T10:00').toISOString()).toBe('2027-02-01T09:00:00.000Z');
    expect(instantFromPragueLocal('2027-06-01T10:00').toISOString()).toBe('2027-06-01T08:00:00.000Z');
  });

  it('reads the times around the spring and autumn clock changes', () => {
    // 28 March 2027: 02:00 becomes 03:00.
    expect(instantFromPragueLocal('2027-03-28T01:59').toISOString()).toBe('2027-03-28T00:59:00.000Z');
    expect(instantFromPragueLocal('2027-03-28T03:00').toISOString()).toBe('2027-03-28T01:00:00.000Z');
    // A time the clocks skip is read an hour later, as the clock shows it then.
    expect(instantFromPragueLocal('2027-03-28T02:30').toISOString()).toBe('2027-03-28T01:30:00.000Z');
    // 31 October 2027: 03:00 becomes 02:00; a time that happens twice is read as the first.
    expect(instantFromPragueLocal('2027-10-31T02:30').toISOString()).toBe('2027-10-31T00:30:00.000Z');
    expect(instantFromPragueLocal('2027-10-31T03:00').toISOString()).toBe('2027-10-31T02:00:00.000Z');
  });
});

describe('pragueLocalOf', () => {
  it('writes an instant as Prague wall-clock time, the reverse of instantFromPragueLocal', () => {
    expect(pragueLocalOf(new Date('2027-02-01T09:00:00Z'))).toBe('2027-02-01T10:00');
    expect(pragueLocalOf(new Date('2027-06-01T08:00:00Z'))).toBe('2027-06-01T10:00');
    expect(pragueLocalOf(instantFromPragueLocal('2027-10-31T02:30'))).toBe('2027-10-31T02:30');
  });
});

describe('pragueLocalSchema', () => {
  it('takes a real date and time to the minute', () => {
    expect(pragueLocalSchema.safeParse('2027-02-28T23:59').success).toBe(true);
  });

  it.each([
    '2027-13-45T25:99',
    '2027-02-30T10:00',
    '0050-01-01T10:00',
    '2027-02-01T24:00',
    '2027-02-01 10:00',
    '2027-02-01T10:00:00',
  ])('refuses %s', (value) => {
    expect(pragueLocalSchema.safeParse(value).success).toBe(false);
  });
});

describe('addDays', () => {
  it('moves a date across month and year ends, leap days included', () => {
    expect(addDays('2027-12-25', 14)).toBe('2028-01-08');
    expect(addDays('2028-02-20', 10)).toBe('2028-03-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
});
