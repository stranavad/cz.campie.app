import { z } from 'zod';

const NAME_MAX_LENGTH = 100;

// Codes of a refused first or last name, which the app translates.
export const PERSON_NAME_ERROR_CODES = ['name_required', 'name_too_long', 'name_invalid'] as const;

export type PersonNameErrorCode = (typeof PERSON_NAME_ERROR_CODES)[number];

// A first or last name as a person types it: trimmed, on one line, without control or invisible formatting
// characters, which could hide or reorder what a reader of the name sees.
export const personNameSchema = z
  .string({ error: 'name_required' })
  .trim()
  .min(1, 'name_required')
  .max(NAME_MAX_LENGTH, 'name_too_long')
  .regex(/^[^\p{C}\p{Zl}\p{Zp}]*$/u, 'name_invalid');

// A person's first and last name, both required.
export const fullNameSchema = z.object({ firstName: personNameSchema, lastName: personNameSchema });

export type FullName = z.infer<typeof fullNameSchema>;

// Someone named by their email and, once they gave it, their name; a view falls back to the email.
export const personSchema = z.object({
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export type Person = z.infer<typeof personSchema>;
