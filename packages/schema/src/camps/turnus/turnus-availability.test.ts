import { describe, expect, it } from 'vitest';

import { instantFromPragueLocal } from '@repo/schema/shared';

import { turnusAvailability } from './turnus-availability.ts';

const OPEN = {
  opensAt: instantFromPragueLocal('2027-03-28T10:00'),
  closesAt: instantFromPragueLocal('2027-06-01T00:00'),
  closedManually: false,
  capacity: 2,
};

const at = (pragueLocal: string, seconds = 0) =>
  new Date(instantFromPragueLocal(pragueLocal).getTime() + seconds * 1000);

describe('turnusAvailability', () => {
  it('is not yet open until the exact opening time, inclusive, across the spring clock change', () => {
    expect(turnusAvailability(OPEN, 0, at('2027-03-28T09:59', 59))).toBe('not_yet_open');
    expect(turnusAvailability(OPEN, 0, at('2027-03-28T10:00'))).toBe('open');
  });

  it('closes at the closing time, exclusive', () => {
    expect(turnusAvailability(OPEN, 0, at('2027-05-31T23:59', 59))).toBe('open');
    expect(turnusAvailability(OPEN, 0, at('2027-06-01T00:00'))).toBe('closed_by_window');
  });

  it('is open without either end of the window', () => {
    const always = { ...OPEN, opensAt: null, closesAt: null };

    expect(turnusAvailability(always, 0, at('2020-01-01T00:00'))).toBe('open');
    expect(turnusAvailability(always, 0, at('2040-01-01T00:00'))).toBe('open');
  });

  it('is full once the Registered Participants reach the capacity', () => {
    expect(turnusAvailability(OPEN, 1, at('2027-04-01T12:00'))).toBe('open');
    expect(turnusAvailability(OPEN, 2, at('2027-04-01T12:00'))).toBe('full');
  });

  it('is closed manually whatever the window and the places', () => {
    const closed = { ...OPEN, closedManually: true };

    expect(turnusAvailability(closed, 0, at('2027-04-01T12:00'))).toBe('closed_manually');
    expect(turnusAvailability(closed, 2, at('2027-02-01T12:00'))).toBe('closed_manually');
  });
});
