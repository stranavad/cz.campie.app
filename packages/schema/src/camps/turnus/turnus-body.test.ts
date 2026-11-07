import { describe, expect, it } from 'vitest';

import { turnusBodySchema } from './turnus-body.ts';

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Tábořiště Pokusov',
  capacity: 40,
  minAge: 7,
  maxAge: 15,
  opensAt: '2027-02-01T18:00',
  closesAt: '2027-06-01T00:00',
  closedManually: false,
  websiteUrl: '',
  basePrice: 6500,
  earlyBirdPrice: 5900,
  earlyBirdLastDay: '2027-03-31',
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const codes = (input: object) =>
  turnusBodySchema.safeParse(input).error?.issues.map(({ path, message }) => [path.join('.'), message]) ?? [];

describe('turnusBodySchema', () => {
  it('takes a whole Turnus, an empty website as none', () => {
    expect(turnusBodySchema.parse(TURNUS)).toMatchObject({ depositDueDays: 14, websiteUrl: null, deposit: 2000 });
  });

  it('stores a Deposit of 0 as none', () => {
    expect(turnusBodySchema.parse({ ...TURNUS, deposit: 0 }).deposit).toBeNull();
  });

  it('allows a Turnus of one day and an open-ended window', () => {
    expect(codes({ ...TURNUS, endDate: TURNUS.startDate, opensAt: null, closesAt: null })).toEqual([]);
  });

  it.each([
    [{ endDate: '2027-07-03' }, 'endDate', 'turnus_ends_before_start'],
    [{ minAge: 16 }, 'minAge', 'turnus_min_age_above_max'],
    [{ closesAt: '2027-02-01T18:00' }, 'closesAt', 'turnus_window_closes_before_open'],
    [{ earlyBirdLastDay: null }, 'earlyBirdLastDay', 'turnus_early_bird_day_required'],
    [{ earlyBirdPrice: null }, 'earlyBirdPrice', 'turnus_early_bird_price_required'],
  ])('refuses %o at the field it concerns', (change, path, code) => {
    expect(codes({ ...TURNUS, ...change })).toEqual([[path, code]]);
  });

  it.each([
    { capacity: 0 },
    { basePrice: -1 },
    { deposit: 1.5 },
    { earlyBirdPrice: -100 },
    { minAge: -1 },
    { startDate: '2027-02-30' },
    { balanceDueDate: '0000-01-01' },
    { depositDueDays: undefined },
  ])('refuses %o', (change) => {
    expect(turnusBodySchema.safeParse({ ...TURNUS, ...change }).success).toBe(false);
  });
});
