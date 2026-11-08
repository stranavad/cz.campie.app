import { describe, expect, it } from 'vitest';

import { amountDueNow, dueDatesOf, type AmountDueInput } from './amount-due.ts';

// Submitted on 10 April in Prague; the Deposit is due 14 days later, on 24 April.
const TERMS = {
  submittedAt: new Date('2027-04-10T10:00:00Z'),
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const DEPOSIT_CHOSEN: AmountDueInput = {
  total: 13_000,
  depositTotal: 4000,
  paid: 0,
  depositDueDate: '2027-04-24',
  balanceDueDate: '2027-06-15',
};

describe('dueDatesOf', () => {
  it('makes the Deposit due the deposit days after submission, with the Turnus balance due date', () => {
    expect(dueDatesOf(TERMS)).toEqual({ depositDueDate: '2027-04-24', balanceDueDate: '2027-06-15' });
  });

  it('never makes the Deposit due after the balance due date', () => {
    expect(dueDatesOf({ ...TERMS, balanceDueDate: '2027-04-20' }).depositDueDate).toBe('2027-04-20');
    expect(dueDatesOf({ ...TERMS, submittedAt: new Date('2027-06-10T10:00:00Z') }).depositDueDate).toBe('2027-06-15');
  });

  it('gives a Registration submitted after the balance due date the deposit days for everything', () => {
    expect(dueDatesOf({ ...TERMS, submittedAt: new Date('2027-06-20T10:00:00Z') })).toEqual({
      depositDueDate: '2027-07-04',
      balanceDueDate: '2027-06-15',
    });
  });

  it('counts the deposit days from the Prague date of submission, across a month end', () => {
    // 22:30 UTC on 30 April is already 1 May in Prague.
    expect(dueDatesOf({ ...TERMS, submittedAt: new Date('2027-04-30T22:30:00Z') }).depositDueDate).toBe('2027-05-15');
  });

  it('has a deposit date without a balance due date', () => {
    expect(dueDatesOf({ ...TERMS, balanceDueDate: null })).toEqual({
      depositDueDate: '2027-04-24',
      balanceDueDate: null,
    });
  });
});

describe('amountDueNow', () => {
  it('owes the Deposits by the deposit date while they are not covered', () => {
    expect(amountDueNow(DEPOSIT_CHOSEN)).toEqual({ phase: 'deposit', amount: 4000, dueDate: '2027-04-24' });
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 1500 })).toEqual({
      phase: 'deposit',
      amount: 2500,
      dueDate: '2027-04-24',
    });
  });

  it('owes the rest by the balance due date once the Deposits are covered', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 4000 })).toEqual({
      phase: 'balance',
      amount: 9000,
      dueDate: '2027-06-15',
    });
  });

  it('owes the total by the deposit date when paying in full', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, depositTotal: null })).toEqual({
      phase: 'full',
      amount: 13_000,
      dueDate: '2027-04-24',
    });
  });

  it('owes no more Deposit than the total, after Price adjustments brought it below', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, total: 3000 })).toEqual({
      phase: 'deposit',
      amount: 3000,
      dueDate: '2027-04-24',
    });
  });

  it('owes nothing, with no date, once paid or overpaid', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 13_000 })).toEqual({ phase: 'settled', amount: 0, dueDate: null });
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 15_000 })).toEqual({ phase: 'settled', amount: 0, dueDate: null });
  });

  it('owes the rest with no date when the Registration has no balance due date', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 4000, balanceDueDate: null })).toEqual({
      phase: 'balance',
      amount: 9000,
      dueDate: null,
    });
  });
});
