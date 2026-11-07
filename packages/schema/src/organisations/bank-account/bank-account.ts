import { z } from 'zod';

// Weights of the Czech National Bank's check of an account's prefix and number, right-aligned.
const PREFIX_WEIGHTS = [10, 5, 8, 4, 2, 1] as const;
const NUMBER_WEIGHTS = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1] as const;

const DOMESTIC_ACCOUNT = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/;

/**
 * Tell whether digits pass the modulo 11 check with the given weights.
 * @param digits the digits, at most as many as weights
 * @param weights the weights, left to right
 */
function passesCheck(digits: string, weights: readonly number[]): boolean {
  const padded = digits.padStart(weights.length, '0');

  return weights.reduce((sum, weight, index) => sum + weight * Number(padded[index]), 0) % 11 === 0;
}

/**
 * Bring a Czech bank account to its usual form: prefix-number/bank code, without leading zeros, the prefix
 * left out when zero.
 * @param account the account with spaces removed
 * @returns null when the account is malformed or fails the check
 */
function canonicalAccount(account: string): string | null {
  const [, prefix = '0', number = '', bankCode = ''] = DOMESTIC_ACCOUNT.exec(account) ?? [];
  const significantNumber = number.replace(/^0+/, '');
  const significantPrefix = prefix.replace(/^0+/, '');

  if (significantNumber.length < 2 || !passesCheck(prefix, PREFIX_WEIGHTS) || !passesCheck(number, NUMBER_WEIGHTS)) {
    return null;
  }

  return `${significantPrefix === '' ? '' : `${significantPrefix}-`}${significantNumber}/${bankCode}`;
}

// A Czech bank account in its domestic form, as payment instructions and QR platba take it; spaces are
// dropped and the result is canonical.
export const bankAccountSchema = z.string().transform((value, context) => {
  const account = canonicalAccount(value.replaceAll(/\s/g, ''));

  if (account === null) {
    context.addIssue({ code: 'custom', message: 'bank_account_invalid' });

    return z.NEVER;
  }

  return account;
});
