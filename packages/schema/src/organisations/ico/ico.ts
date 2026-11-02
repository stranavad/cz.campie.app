import { z } from 'zod';

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;

/**
 * Tell whether eight digits form an IČO: the last is the check digit of the first seven.
 * @param ico eight digits
 */
function hasValidCheckDigit(ico: string): boolean {
  const sum = WEIGHTS.reduce((total, weight, index) => total + weight * Number(ico[index]), 0);

  return (11 - (sum % 11)) % 10 === Number(ico[7]);
}

// An Organisation's identification number, as the business register issues it; spaces are dropped.
export const icoSchema = z
  .string()
  .transform((value) => value.replaceAll(/\s/g, ''))
  .refine((value) => /^\d{8}$/.test(value) && hasValidCheckDigit(value), 'ico_invalid');
