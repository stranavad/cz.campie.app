import { describe, expect, it } from 'vitest';

import { paymentInstructionsOf } from './payment-instructions.ts';

const REGISTRATION = {
  total: 13_300,
  depositTotal: 4000,
  paid: 0,
  submittedAt: new Date('2027-04-10T10:00:00Z'),
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
  account: '19-2000145399/0800',
  variableSymbol: '27123456',
  message: 'Letní tábor',
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
    });
  });

  it('asks for the whole price by the earlier date when paying in full', () => {
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
});
