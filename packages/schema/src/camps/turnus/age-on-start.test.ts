import { describe, expect, it } from 'vitest';

import { ageOnStart, ageProblem } from './age-on-start.ts';

const TURNUS = { startDate: '2027-07-04', minAge: 7, maxAge: 15 };

describe('ageOnStart', () => {
  it('counts completed years on the start date, the birthday itself included', () => {
    expect(ageOnStart('2020-07-04', '2027-07-04')).toBe(7);
    expect(ageOnStart('2020-07-05', '2027-07-04')).toBe(6);
    expect(ageOnStart('2020-02-29', '2027-02-28')).toBe(6);
    expect(ageOnStart('2020-02-29', '2027-03-01')).toBe(7);
  });
});

describe('ageProblem', () => {
  it('admits both limits inclusively', () => {
    expect(ageProblem('2020-07-04', TURNUS)).toBeNull();
    expect(ageProblem('2011-07-05', TURNUS)).toBeNull();
  });

  it('names a child below or above the limits', () => {
    expect(ageProblem('2020-07-05', TURNUS)).toBe('too_young');
    expect(ageProblem('2011-07-04', TURNUS)).toBe('too_old');
  });

  it('checks no limit a Turnus leaves open', () => {
    expect(ageProblem('2025-01-01', { ...TURNUS, minAge: null })).toBeNull();
    expect(ageProblem('1990-01-01', { ...TURNUS, maxAge: null })).toBeNull();
  });
});
