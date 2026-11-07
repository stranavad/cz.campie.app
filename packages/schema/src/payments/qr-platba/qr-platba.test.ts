import { describe, expect, it } from 'vitest';

import { ibanOf, qrPlatbaOf } from './qr-platba.ts';

describe('ibanOf', () => {
  it.each([
    ['19-2000145399/0800', 'CZ6508000000192000145399'],
    ['2000145399/0800', 'CZ7908000000002000145399'],
    ['123-4567890123/0100', 'CZ1001000001234567890123'],
  ])('turns %s into its IBAN', (account, iban) => {
    expect(ibanOf(account)).toBe(iban);
  });
});

describe('qrPlatbaOf', () => {
  const PAYMENT = {
    account: '19-2000145399/0800',
    amount: 4000,
    variableSymbol: '27123456',
    message: 'Letní tábor',
    dueDate: '2027-04-24',
  };

  it('encodes the account, amount due now, Variable symbol, due date and message', () => {
    expect(qrPlatbaOf(PAYMENT)).toBe(
      'SPD*1.0*ACC:CZ6508000000192000145399*AM:4000.00*CC:CZK*X-VS:27123456*DT:20270424*MSG:LETNI TABOR',
    );
  });

  it('leaves out a missing due date', () => {
    expect(qrPlatbaOf({ ...PAYMENT, dueDate: null })).not.toContain('DT:');
  });

  it('keeps the message to 60 plain capitals, without the asterisk that separates fields', () => {
    const message = qrPlatbaOf({ ...PAYMENT, message: `Tábor *${'á'.repeat(80)}` }).split('*MSG:')[1];

    expect(message).toBe(`TABOR ${'A'.repeat(54)}`);
  });

  it('refuses an account not in its domestic form', () => {
    expect(() => qrPlatbaOf({ ...PAYMENT, account: 'CZ6508000000192000145399' })).toThrow('not a Czech account');
  });
});
