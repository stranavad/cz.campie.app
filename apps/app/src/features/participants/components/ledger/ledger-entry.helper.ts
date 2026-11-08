import { HttpError } from '@/lib/api';

/**
 * Read a whole CZK amount as typed, spaces allowed; null when it is not one.
 * @param text the amount as typed
 * @param signed whether a minus sign is allowed
 */
export function amountOf(text: string, signed: boolean): number | null {
  const plain = text.replaceAll(/\s/g, '');

  return (signed ? /^-?\d+$/ : /^\d+$/).test(plain) && Number(plain) !== 0 ? Number(plain) : null;
}

/**
 * Name why a ledger entry was refused.
 * @param error what it failed with
 */
export function failureOf(
  error: Error | null,
): 'correction_exceeds_paid' | 'price_adjustment_below_zero' | 'unexpected' | null {
  if (error === null) {
    return null;
  }

  const code = error instanceof HttpError ? error.code : undefined;

  return code === 'correction_exceeds_paid' || code === 'price_adjustment_below_zero' ? code : 'unexpected';
}
