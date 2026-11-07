import { z } from 'zod';

// A Czech VAT number, entered only by a VAT payer; empty or null means none. Its output parses again, so
// the app can send what its form parsed.
export const vatIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => value === '' || /^CZ\d{8,10}$/.test(value), 'vat_id_invalid')
  .nullable()
  .transform((value) => (value === '' ? null : value));
