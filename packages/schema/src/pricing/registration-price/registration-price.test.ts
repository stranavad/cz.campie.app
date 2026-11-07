import { describe, expect, it } from 'vitest';

import { priceRegistration, type PricingInput } from './registration-price.ts';

const PRICE_LIST = {
  basePrice: 6500,
  earlyBirdPrice: 5900,
  earlyBirdLastDay: '2027-03-31',
  deposit: 2000,
  balanceDueDate: '2027-06-15',
};

// Submitted in April, so the Base price applies, with no extras, sibling discount or code.
const INPUT: PricingInput = {
  priceList: PRICE_LIST,
  siblingDiscount: null,
  participants: [{ surcharges: [] }],
  discountCode: null,
  paymentChoice: 'full',
  submittedAt: new Date('2027-04-10T10:00:00Z'),
};

const children = (count: number) => Array.from({ length: count }, () => ({ surcharges: [] }));

describe('priceRegistration', () => {
  it('prices each child at the Base price', () => {
    const price = priceRegistration({ ...INPUT, participants: children(2) });

    expect(price.lines).toEqual([
      { kind: 'base_price', participant: 0, label: null, amount: 6500 },
      { kind: 'base_price', participant: 1, label: null, amount: 6500 },
    ]);
    expect(price.total).toBe(13_000);
  });

  it('applies the Early bird price through its last day in Prague, near midnight UTC', () => {
    // 22:00 UTC on 31 March is already midnight of 1 April in Prague (summer time).
    const lastEvening = priceRegistration({ ...INPUT, submittedAt: new Date('2027-03-31T21:59:59Z') });
    const nextDay = priceRegistration({ ...INPUT, submittedAt: new Date('2027-03-31T22:00:00Z') });

    expect(lastEvening.lines).toEqual([{ kind: 'early_bird_price', participant: 0, label: null, amount: 5900 }]);
    expect(nextDay.lines).toEqual([{ kind: 'base_price', participant: 0, label: null, amount: 6500 }]);
  });

  it('gives Paid extras and Claimed discounts each their own line per child', () => {
    const price = priceRegistration({
      ...INPUT,
      participants: [
        {
          surcharges: [
            { label: 'Doprava autobusem', amount: 400 },
            { label: 'Sleva pro stálé táborníky', amount: -300 },
          ],
        },
      ],
    });

    expect(price.lines).toEqual([
      { kind: 'base_price', participant: 0, label: null, amount: 6500 },
      { kind: 'paid_extra', participant: 0, label: 'Doprava autobusem', amount: 400 },
      { kind: 'claimed_discount', participant: 0, label: 'Sleva pro stálé táborníky', amount: -300 },
    ]);
    expect(price.total).toBe(6600);
  });

  it.each([
    ['every_child', 1, []],
    ['every_child', 2, [0, 1]],
    ['every_child', 3, [0, 1, 2]],
    ['from_second_child', 1, []],
    ['from_second_child', 2, [1]],
    ['from_second_child', 3, [1, 2]],
  ] as const)('gives the Sibling discount (%s) with %i children to children %j', (appliesTo, count, discounted) => {
    const price = priceRegistration({
      ...INPUT,
      siblingDiscount: { amount: 500, appliesTo },
      participants: children(count),
    });

    expect(price.lines.filter(({ kind }) => kind === 'sibling_discount')).toEqual(
      discounted.map((participant) => ({ kind: 'sibling_discount', participant, label: null, amount: -500 })),
    );
    expect(price.total).toBe(count * 6500 - discounted.length * 500);
  });

  it('takes a percentage code off the per-child prices before the Sibling discount, not off extras', () => {
    const price = priceRegistration({
      ...INPUT,
      siblingDiscount: { amount: 500, appliesTo: 'every_child' },
      participants: [{ surcharges: [{ label: 'Tričko', amount: 250 }] }, { surcharges: [] }],
      discountCode: { code: 'LETO10', kind: 'percentage', value: 10 },
    });

    expect(price.lines).toContainEqual({ kind: 'discount_code', participant: null, label: 'LETO10', amount: -1300 });
    expect(price.total).toBe(13_000 + 250 - 1300 - 1000);
  });

  it('rounds a percentage code to whole CZK, half up in favour of the guardian', () => {
    const price = priceRegistration({
      ...INPUT,
      priceList: { ...PRICE_LIST, basePrice: 6550 },
      discountCode: { code: 'JEDNO', kind: 'percentage', value: 1 },
    });

    expect(price.lines).toContainEqual({ kind: 'discount_code', participant: null, label: 'JEDNO', amount: -66 });
  });

  it('takes a fixed code off the Registration total, after the Sibling discount', () => {
    const price = priceRegistration({
      ...INPUT,
      siblingDiscount: { amount: 500, appliesTo: 'from_second_child' },
      participants: children(2),
      discountCode: { code: 'MINUS1000', kind: 'fixed', value: 1000 },
    });

    expect(price.lines.at(-1)).toEqual({ kind: 'discount_code', participant: null, label: 'MINUS1000', amount: -1000 });
    expect(price.total).toBe(13_000 - 500 - 1000);
  });

  it('never goes below zero: a code takes at most what is left', () => {
    const price = priceRegistration({ ...INPUT, discountCode: { code: 'ZDARMA', kind: 'fixed', value: 99_999 } });

    expect(price.lines.at(-1)).toEqual({ kind: 'discount_code', participant: null, label: 'ZDARMA', amount: -6500 });
    expect(price.total).toBe(0);
  });

  it('takes nothing for a code when discounts alone already exceed the price', () => {
    const price = priceRegistration({
      ...INPUT,
      participants: [{ surcharges: [{ label: 'Sleva', amount: -9000 }] }],
      discountCode: { code: 'MINUS500', kind: 'fixed', value: 500 },
    });

    expect(price.lines).toContainEqual({ kind: 'discount_code', participant: null, label: 'MINUS500', amount: 0 });
    expect(price.lines.every(({ kind, amount }) => kind !== 'discount_code' || amount <= 0)).toBe(true);
    expect(price.total).toBe(0);
  });

  it('never goes below zero when Claimed discounts alone exceed the price', () => {
    const price = priceRegistration({
      ...INPUT,
      participants: [{ surcharges: [{ label: 'Sleva', amount: -9000 }] }],
    });

    expect(price.lines.at(-1)).toEqual({ kind: 'zero_floor', participant: null, label: null, amount: 2500 });
    expect(price.total).toBe(0);
    expect(price.lines.reduce((sum, { amount }) => sum + amount, 0)).toBe(0);
  });

  it('owes the Deposit per child when chosen and the Turnus has one', () => {
    const price = priceRegistration({ ...INPUT, participants: children(3), paymentChoice: 'deposit' });

    expect(price).toMatchObject({ depositAvailable: true, depositTotal: 6000 });
  });

  it('owes no Deposit when paying in full', () => {
    expect(priceRegistration(INPUT)).toMatchObject({ depositAvailable: true, depositTotal: null });
  });

  it('reports a Deposit of 0 unavailable, and owes none', () => {
    const price = priceRegistration({ ...INPUT, priceList: { ...PRICE_LIST, deposit: 0 }, paymentChoice: 'deposit' });

    expect(price).toMatchObject({ depositAvailable: false, depositTotal: null });
  });

  it('reports the Deposit unavailable when the Turnus has none, and owes none', () => {
    const price = priceRegistration({
      ...INPUT,
      priceList: { ...PRICE_LIST, deposit: null },
      paymentChoice: 'deposit',
    });

    expect(price).toMatchObject({ depositAvailable: false, depositTotal: null });
    expect(price.total).toBe(6500);
  });

  it('reports the Deposit unavailable after the balance due date, in Prague', () => {
    const onTheDay = priceRegistration({
      ...INPUT,
      paymentChoice: 'deposit',
      submittedAt: new Date('2027-06-15T21:59:59Z'),
    });
    const after = priceRegistration({
      ...INPUT,
      paymentChoice: 'deposit',
      submittedAt: new Date('2027-06-15T22:00:00Z'),
    });

    expect(onTheDay).toMatchObject({ depositAvailable: true, depositTotal: 2000 });
    expect(after).toMatchObject({ depositAvailable: false, depositTotal: null });
  });

  it('owes no more Deposit than the total', () => {
    const price = priceRegistration({
      ...INPUT,
      paymentChoice: 'deposit',
      discountCode: { code: 'VELKA', kind: 'fixed', value: 5000 },
    });

    expect(price).toMatchObject({ total: 1500, depositTotal: 1500 });
  });
});
