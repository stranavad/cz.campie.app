import { describe, expect, it } from 'vitest';

import { bankAccountSchema } from './bank-account.ts';

describe('bankAccountSchema', () => {
  it.each([
    ['1234567899/0100', '1234567899/0100'],
    ['35-1000000005/0300', '35-1000000005/0300'],
    ['51/0800', '51/0800'],
  ])('accepts %s, whose check sums hold', (input, output) => {
    expect(bankAccountSchema.parse(input)).toBe(output);
  });

  it('drops spaces and leading zeros, and a zero prefix', () => {
    expect(bankAccountSchema.parse(' 000035 - 0000000051 / 0300 ')).toBe('35-51/0300');
    expect(bankAccountSchema.parse('000000-1234567899/0100')).toBe('1234567899/0100');
  });

  it.each([
    '1234567890/0100',
    '34-1000000005/0300',
    '1/0100',
    '1234567899/100',
    '1234567899',
    '12345678901/0100',
    '1234567-1234567899/0100',
    'CZ6501000000001234567899',
    'abc/0100',
  ])('rejects %s', (input) => {
    expect(bankAccountSchema.safeParse(input).error?.issues).toEqual([
      expect.objectContaining({ message: 'bank_account_invalid' }),
    ]);
  });
});
