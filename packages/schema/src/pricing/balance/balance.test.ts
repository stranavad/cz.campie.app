import { describe, expect, it } from 'vitest';

import { balanceOf } from './balance.ts';

const REGISTRATION = {
  lines: [{ amount: 6500 }, { amount: 6500 }, { amount: 300 }],
  adjustments: [] as { amount: number }[],
  payments: [] as { amount: number }[],
  depositTotal: 4000,
  submittedAt: new Date('2027-04-10T10:00:00Z'),
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

describe('balanceOf', () => {
  it('owes the Deposits by the deposit date while nothing is paid', () => {
    expect(balanceOf(REGISTRATION, '2027-04-10')).toEqual({
      total: 13_300,
      paid: 0,
      balance: 13_300,
      status: 'unpaid',
      amountDue: { phase: 'deposit', amount: 4000, dueDate: '2027-04-24' },
      overdue: false,
    });
  });

  it('counts a payment below the Deposits as unpaid, and the Deposits covered as deposit paid', () => {
    expect(balanceOf({ ...REGISTRATION, payments: [{ amount: 1000 }] }, '2027-04-10')).toMatchObject({
      status: 'unpaid',
      amountDue: { phase: 'deposit', amount: 3000 },
    });
    expect(balanceOf({ ...REGISTRATION, payments: [{ amount: 4000 }] }, '2027-04-10')).toMatchObject({
      status: 'deposit_paid',
      amountDue: { phase: 'balance', amount: 9300, dueDate: '2027-06-15' },
    });
  });

  it('is paid at the total and overpaid above it, a Correcting payment taking money back', () => {
    expect(balanceOf({ ...REGISTRATION, payments: [{ amount: 13_300 }] }, '2027-04-10')).toMatchObject({
      status: 'paid',
      balance: 0,
      amountDue: { phase: 'settled', amount: 0 },
    });
    expect(balanceOf({ ...REGISTRATION, payments: [{ amount: 14_000 }] }, '2027-04-10')).toMatchObject({
      status: 'overpaid',
      balance: -700,
    });
    expect(
      balanceOf({ ...REGISTRATION, payments: [{ amount: 14_000 }, { amount: -700 }] }, '2027-04-10'),
    ).toMatchObject({ status: 'paid' });
  });

  it('asks for the whole price when paying in full, with no deposit paid status', () => {
    expect(
      balanceOf({ ...REGISTRATION, depositTotal: null, payments: [{ amount: 4000 }] }, '2027-04-10'),
    ).toMatchObject({ status: 'unpaid', amountDue: { phase: 'full', amount: 9300, dueDate: '2027-04-24' } });
  });

  it('adds Price adjustments to the total, never below zero', () => {
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -1300 }] }, '2027-04-10').total).toBe(12_000);
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -20_000 }] }, '2027-04-10')).toMatchObject({
      total: 0,
      status: 'paid',
    });
  });

  it('is Overdue only after the due date, while something is due', () => {
    expect(balanceOf(REGISTRATION, '2027-04-24').overdue).toBe(false);
    expect(balanceOf(REGISTRATION, '2027-04-25').overdue).toBe(true);
    expect(balanceOf({ ...REGISTRATION, payments: [{ amount: 4000 }] }, '2027-04-25').overdue).toBe(false);
  });

  it('owes no more than the total when Price adjustments take it below the Deposits', () => {
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -10_300 }] }, '2027-04-10')).toMatchObject({
      total: 3000,
      amountDue: { phase: 'deposit', amount: 3000 },
    });
  });

  it('asks a Registration submitted after the balance due date for everything within the deposit days', () => {
    const late = { ...REGISTRATION, depositTotal: null, submittedAt: new Date('2027-06-20T10:00:00Z') };

    expect(balanceOf(late, '2027-06-20').amountDue).toEqual({ phase: 'full', amount: 13_300, dueDate: '2027-07-04' });
  });
});
