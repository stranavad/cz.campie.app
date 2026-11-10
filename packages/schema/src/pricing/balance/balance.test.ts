import { describe, expect, it } from 'vitest';

import { balanceOf, type Payer } from './balance.ts';

const guardian = (amount: number) => ({ amount, payer: 'guardian' as const });
const company = (amount: number) => ({ amount, payer: 'company' as const });

const REGISTRATION = {
  lines: [{ amount: 6500 }, { amount: 6500 }, { amount: 300 }],
  adjustments: [] as { amount: number }[],
  payments: [] as { amount: number; payer: Payer }[],
  invoiced: null as number | null,
  depositTotal: 4000,
  depositDueDate: '2027-04-24',
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
      guardian: { share: 13_300, paid: 0, balance: 13_300 },
      company: null,
    });
  });

  it('counts a payment below the Deposits as partly paid, and the Deposits covered as deposit paid', () => {
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(1000)] }, '2027-04-10')).toMatchObject({
      status: 'partly_paid',
      amountDue: { phase: 'deposit', amount: 3000 },
    });
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(4000)] }, '2027-04-10')).toMatchObject({
      status: 'deposit_paid',
      amountDue: { phase: 'balance', amount: 9300, dueDate: '2027-06-15' },
    });
  });

  it('is unpaid again once a Correcting payment takes everything back', () => {
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(1000), guardian(-1000)] }, '2027-04-10').status).toBe(
      'unpaid',
    );
  });

  it('is paid at the total and overpaid above it, a Correcting payment taking money back', () => {
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(13_300)] }, '2027-04-10')).toMatchObject({
      status: 'paid',
      balance: 0,
      amountDue: { phase: 'settled', amount: 0 },
    });
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(14_000)] }, '2027-04-10')).toMatchObject({
      status: 'overpaid',
      balance: -700,
    });
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(14_000), guardian(-700)] }, '2027-04-10')).toMatchObject({
      status: 'paid',
    });
  });

  it('counts part of the whole price as partly paid when paying in full', () => {
    expect(balanceOf({ ...REGISTRATION, depositTotal: null, payments: [guardian(4000)] }, '2027-04-10')).toMatchObject({
      status: 'partly_paid',
      amountDue: { phase: 'full', amount: 9300, dueDate: '2027-04-24' },
    });
  });

  it('adds Price adjustments to the total, never below zero', () => {
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -1300 }] }, '2027-04-10').total).toBe(12_000);
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -20_000 }] }, '2027-04-10')).toMatchObject({
      total: 0,
      status: 'paid',
    });
  });

  it('is Overdue only after the due date, while something is due, partly paid or not', () => {
    expect(balanceOf(REGISTRATION, '2027-04-24').overdue).toBe(false);
    expect(balanceOf(REGISTRATION, '2027-04-25').overdue).toBe(true);
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(1000)] }, '2027-04-25')).toMatchObject({
      status: 'partly_paid',
      overdue: true,
    });
    expect(balanceOf({ ...REGISTRATION, payments: [guardian(4000)] }, '2027-04-25').overdue).toBe(false);
  });

  it('owes no more than the total when Price adjustments take it below the Deposits', () => {
    expect(balanceOf({ ...REGISTRATION, adjustments: [{ amount: -10_300 }] }, '2027-04-10')).toMatchObject({
      total: 3000,
      amountDue: { phase: 'deposit', amount: 3000 },
    });
  });

  describe('with an Invoice request', () => {
    const INVOICED = {
      lines: [{ amount: 10_000 }],
      adjustments: [] as { amount: number }[],
      payments: [] as { amount: number; payer: Payer }[],
      invoiced: 6000,
      depositTotal: 3000,
      depositDueDate: '2027-04-24',
      balanceDueDate: '2027-06-15',
    };

    it('owes the share of the guardian: the Deposit by the deposit date, then the rest of the share', () => {
      expect(balanceOf(INVOICED, '2027-04-10')).toMatchObject({
        amountDue: { phase: 'deposit', amount: 3000, dueDate: '2027-04-24' },
        guardian: { share: 4000, paid: 0, balance: 4000 },
        company: { invoiced: 6000, paid: 0, balance: 6000 },
      });
      expect(balanceOf({ ...INVOICED, payments: [guardian(3000)] }, '2027-04-10').amountDue).toEqual({
        phase: 'balance',
        amount: 1000,
        dueDate: '2027-06-15',
      });
    });

    it('leaves the amount due of the guardian and Overdue alone when the company pays', () => {
      expect(balanceOf({ ...INVOICED, payments: [company(6000)] }, '2027-04-25')).toMatchObject({
        amountDue: { phase: 'deposit', amount: 3000, dueDate: '2027-04-24' },
        overdue: true,
        status: 'deposit_paid',
        company: { invoiced: 6000, paid: 6000, balance: 0 },
      });
    });

    it('owes the guardian nothing when all is invoiced, unpaid until the company pays', () => {
      const all = { ...INVOICED, invoiced: 10_000 };

      expect(balanceOf(all, '2027-07-01')).toMatchObject({
        status: 'unpaid',
        amountDue: { phase: 'settled', amount: 0, dueDate: null },
        overdue: false,
        guardian: { share: 0, paid: 0, balance: 0 },
      });
      expect(balanceOf({ ...all, payments: [company(10_000)] }, '2027-07-01').status).toBe('paid');
    });

    it('is paid only when the guardian and the company together reach the total', () => {
      expect(balanceOf({ ...INVOICED, payments: [guardian(4000)] }, '2027-04-10').status).toBe('deposit_paid');
      expect(balanceOf({ ...INVOICED, payments: [guardian(4000), company(5000)] }, '2027-04-10').status).toBe(
        'deposit_paid',
      );
      expect(balanceOf({ ...INVOICED, payments: [guardian(4000), company(6000)] }, '2027-04-10').status).toBe('paid');
    });

    it('clamps the share of the guardian at zero when the total falls below the invoiced amount', () => {
      expect(balanceOf({ ...INVOICED, adjustments: [{ amount: -5000 }] }, '2027-04-10')).toMatchObject({
        guardian: { share: 0, balance: 0 },
        company: { invoiced: 6000, balance: 6000 },
      });
    });
  });
});
