import { describe, expect, it } from 'vitest';

import { paymentInstructionsOf } from './payment-instructions.ts';

const REGISTRATION = {
  total: 13_300,
  depositTotal: 4000,
  paid: 0,
  depositDueDate: '2027-04-24',
  balanceDueDate: '2027-06-15',
  account: '19-2000145399/0800',
  variableSymbol: '27123456',
  message: 'Letní tábor',
  invoice: null,
};

describe('paymentInstructionsOf', () => {
  it('asks for the Deposits first and offers the rest, or everything at once with its own QR', () => {
    expect(paymentInstructionsOf(REGISTRATION)).toEqual({
      account: '19-2000145399/0800',
      variableSymbol: '27123456',
      kind: 'deposit',
      amount: 4000,
      dueDate: '2027-04-24',
      balance: {
        amount: 9300,
        dueDate: '2027-06-15',
        outstanding: 13_300,
        qrPlatba: 'SPD*1.0*ACC:CZ6508000000192000145399*AM:13300.00*CC:CZK*X-VS:27123456*DT:20270424*MSG:LETNI TABOR',
      },
      qrPlatba: 'SPD*1.0*ACC:CZ6508000000192000145399*AM:4000.00*CC:CZK*X-VS:27123456*DT:20270424*MSG:LETNI TABOR',
      invoiced: null,
    });
  });

  it('offers no second QR once the amount due now is everything outstanding', () => {
    expect(paymentInstructionsOf({ ...REGISTRATION, paid: 4000 })).toMatchObject({
      kind: 'full',
      amount: 9300,
      dueDate: '2027-06-15',
      balance: null,
    });
  });

  it('asks for the whole price by the deposit date when paying in full', () => {
    expect(paymentInstructionsOf({ ...REGISTRATION, depositTotal: null })).toMatchObject({
      kind: 'full',
      amount: 13_300,
      dueDate: '2027-04-24',
      balance: null,
      qrPlatba: expect.stringContaining('*AM:13300.00*'),
    });
  });

  it('gives no QR platba without an account or anything to pay', () => {
    expect(paymentInstructionsOf({ ...REGISTRATION, account: null }).qrPlatba).toBeNull();
    expect(paymentInstructionsOf({ ...REGISTRATION, total: 0, depositTotal: null }).qrPlatba).toBeNull();
  });

  it('offers no rest when the Deposits cover the whole price', () => {
    expect(paymentInstructionsOf({ ...REGISTRATION, total: 4000 }).balance).toBeNull();
  });

  it('asks the guardian for their share only, naming what is invoiced to the company', () => {
    const invoice = { companyName: 'Fiktivní firma s.r.o.', amount: 10_000 };

    expect(paymentInstructionsOf({ ...REGISTRATION, invoice })).toMatchObject({
      kind: 'deposit',
      amount: 3300,
      balance: null,
      qrPlatba: expect.stringContaining('*AM:3300.00*'),
      invoiced: { companyName: 'Fiktivní firma s.r.o.', amount: 10_000 },
    });
    expect(paymentInstructionsOf({ ...REGISTRATION, invoice: { ...invoice, amount: 13_300 } })).toMatchObject({
      amount: 0,
      qrPlatba: null,
      balance: null,
      invoiced: { amount: 13_300 },
    });
  });
});
