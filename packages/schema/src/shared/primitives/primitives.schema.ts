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

/**
 * A text on several lines, such as a few paragraphs for guardians: trimmed, line breaks as `\n`, and no other
 * control or invisible formatting character, so nothing hides or reorders what readers see. The zero-width
 * joiner stays, as emoji such as a family are built with it.
 * @param max the longest it may be
 */
export function multilineText(max: number) {
  return z
    .string()
    .transform((value) => value.replaceAll('\r\n', '\n').trim())
    .pipe(
      z
        .string()
        .max(max)
        .regex(/^(?:[^\p{C}\p{Zl}\p{Zp}]|\n|‍)*$/u, 'text_invalid'),
    );
}

// Whole CZK, never negative, well inside a 32-bit integer.
export const czkSchema = z.number().int().min(0).max(10_000_000);

// The years the platform deals in; anything else is a typo, and the database's dates end somewhere too.
const MIN_YEAR = 2000;
const MAX_YEAR = 2099;

/**
 * Tell whether a year, month and day make a real date in the years the platform deals in.
 * @param year the year
 * @param month 1 to 12
 * @param day 1 to 31
 */
export function isPlausibleDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// A calendar date, YYYY-MM-DD, that exists and lies between 2000 and 2099.
export const calendarDateSchema = z.iso.date().refine((value) => {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];

  return isPlausibleDate(year, month, day);
}, 'date_invalid');
