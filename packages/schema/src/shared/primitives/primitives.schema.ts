import { z } from 'zod';

// Messages of custom checks are i18n keys the app translates; the built-in checks come with Zod's locale.

// Lowercased, so one address is one admin identity however it was typed.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

// Digits and spaces, optionally after a +, as people write them: +420 123 456 789.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ]{7,18}[0-9]$/, 'phone_invalid');

/**
 * A required single-line text, trimmed.
 * @param max the longest it may be
 */
export function requiredText(max: number) {
  return z.string().trim().min(1).max(max);
}
