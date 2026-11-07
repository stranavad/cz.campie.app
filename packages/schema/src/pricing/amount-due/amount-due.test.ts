import { describe, expect, it } from 'vitest';

import { amountDueNow, type AmountDueInput } from './amount-due.ts';

// Submitted on 10 April in Prague; the Deposit is due 14 days later, on 24 April.
const DEPOSIT_CHOSEN: AmountDueInput = {
  total: 13_000,
  depositTotal: 4000,
  paid: 0,
  submittedAt: new Date('2027-04-10T10:00:00Z'),
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

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

  it('owes the total by the earlier of the deposit date and the balance due date when paying in full', () => {
    const full = { ...DEPOSIT_CHOSEN, depositTotal: null };

    expect(amountDueNow(full)).toEqual({ phase: 'full', amount: 13_000, dueDate: '2027-04-24' });
    expect(amountDueNow({ ...full, balanceDueDate: '2027-04-20' })).toEqual({
      phase: 'full',
      amount: 13_000,
      dueDate: '2027-04-20',
    });
  });

  it('owes the full amount within the deposit days when submitted after the balance due date', () => {
    const late = { ...DEPOSIT_CHOSEN, depositTotal: null, submittedAt: new Date('2027-06-20T10:00:00Z') };

    expect(amountDueNow(late)).toEqual({ phase: 'full', amount: 13_000, dueDate: '2027-07-04' });
  });

  it('counts the deposit days from the Prague date of submission, across a month end', () => {
    // 22:30 UTC on 30 April is already 1 May in Prague.
    const lateEvening = { ...DEPOSIT_CHOSEN, submittedAt: new Date('2027-04-30T22:30:00Z') };

    expect(amountDueNow(lateEvening).dueDate).toBe('2027-05-15');
  });

  it('owes no more Deposit than the total, after Price adjustments brought it below', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, total: 3000 })).toEqual({
      phase: 'deposit',
      amount: 3000,
      dueDate: '2027-04-24',
    });
  });

  it('never makes the Deposit due after the balance due date', () => {
    const lateDeposit = { ...DEPOSIT_CHOSEN, submittedAt: new Date('2027-06-10T10:00:00Z') };

    expect(amountDueNow(lateDeposit).dueDate).toBe('2027-06-15');
  });

  it('owes nothing, with no date, once paid or overpaid', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 13_000 })).toEqual({ phase: 'settled', amount: 0, dueDate: null });
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 15_000 })).toEqual({ phase: 'settled', amount: 0, dueDate: null });
  });

  it('owes the rest with no date when the Turnus sets no balance due date', () => {
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, paid: 4000, balanceDueDate: null })).toEqual({
      phase: 'balance',
      amount: 9000,
      dueDate: null,
    });
    expect(amountDueNow({ ...DEPOSIT_CHOSEN, depositTotal: null, balanceDueDate: null }).dueDate).toBe('2027-04-24');
  });
});
