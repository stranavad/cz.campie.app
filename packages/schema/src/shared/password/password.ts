import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 200;

// Fewer different characters than this, or fewer characters that break a run, make a password guessable
// however long it is.
const MIN_VARIETY = 6;

// Runs a person types without thinking: the alphabet, the digits and the letter rows of an English and a
// Czech keyboard, each row continuing into the next as fingers sweep down.
const RUNS = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertyuiopasdfghjklzxcvbnm', 'qwertzuiopasdfghjklyxcvbnm'];

// Shorter parts of an email are common syllables, not something that identifies the admin.
const MIN_WORD_LENGTH = 4;

// Codes of a password an admin may not choose, which the app translates.
export const PASSWORD_ERROR_CODES = [
  'password_too_short',
  'password_too_long',
  'password_too_simple',
  'password_guessable',
] as const;

export type PasswordErrorCode = (typeof PASSWORD_ERROR_CODES)[number];

// The length bounds only: the full check needs the admin's email and the product name, so the API runs it
// with passwordProblem() and the forms add it to their own schemas.
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'password_too_short')
  .max(PASSWORD_MAX_LENGTH, 'password_too_long');

/**
 * Tell why a password is too weak for an admin: too short or long, too few different characters, a run
 * along the keyboard, the alphabet or the digits, or the admin's email or the product name inside it.
 * @param password the password as typed
 * @param context the admin's email when known, and the configured product name
 */
export function passwordProblem(
  password: string,
  context: { email?: string; productName: string },
): PasswordErrorCode | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'password_too_short';
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'password_too_long';
  }

  const lowercase = password.toLowerCase();

  if (new Set(lowercase).size < MIN_VARIETY || runBreaks(lowercase) < MIN_VARIETY) {
    return 'password_too_simple';
  }

  return guessableWords(context).some((word) => lowercase.includes(word)) ? 'password_guessable' : null;
}

/**
 * Count the characters that neither repeat the one before nor continue a run from it, in either direction.
 * @param password the password, lowercase
 */
function runBreaks(password: string): number {
  // Code points, not graphemes: only ASCII runs matter here.
  const characters = Array.from(password);

  return characters.filter((character, index) => {
    const previous = characters[index - 1];

    return (
      previous === undefined || (character !== previous && !RUNS.some((run) => adjacent(run, previous, character)))
    );
  }).length;
}

function adjacent(run: string, a: string, b: string): boolean {
  return run.includes(a + b) || run.includes(b + a);
}

/**
 * List the words a password must not contain: the email's local part and its longer pieces, and the
 * product name.
 * @param context the admin's email when known, and the product name
 */
function guessableWords({ email, productName }: { email?: string; productName: string }): string[] {
  const localPart = email?.toLowerCase().split('@')[0] ?? '';
  const words = [localPart, ...localPart.split(/[.\-_+]/), productName.toLowerCase()];

  return words.filter((word) => word.length >= MIN_WORD_LENGTH);
}
