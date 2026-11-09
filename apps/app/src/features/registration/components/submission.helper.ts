import type { Answers, FormField } from '@repo/schema/form-engine';
import { SUBMISSION_ERROR_CODES, type SubmissionErrorCode } from '@repo/schema/registrations';
import type { FieldError } from '@repo/schema/shared';

import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

export const samePath = (one: readonly (string | number)[], other: readonly (string | number)[]) =>
  one.length === other.length && one.every((part, index) => part === other[index]);

/**
 * Read why the server refused a submission: its code and the reasons at the fields.
 * @param error what the submission failed with
 */
export function refusalOf(error: Error | null): { code: string | null; fields: readonly FieldError[] } {
  if (error === null) {
    return { code: null, fields: [] };
  }

  const response = error instanceof HttpError ? readErrorResponse(error.details) : null;

  return { code: response?.code ?? 'unknown', fields: response?.fields ?? [] };
}

/**
 * Name the message of a refusal that no field explains.
 * @param code the error response's code
 */
export function refusalKeyOf(code: string): SubmissionErrorCode | 'requests_throttled' | 'unknown' {
  return [...SUBMISSION_ERROR_CODES, 'requests_throttled' as const].find((known) => known === code) ?? 'unknown';
}

/**
 * Keep only the answers to fields the form asks now: a newer version may have removed one.
 * @param answers the answers
 * @param fields the fields asked
 */
export function askedAnswers(answers: Answers, fields: readonly FormField[]): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([key]) => fields.some((field) => field.key === key)));
}

/**
 * Take the guardian to the first thing wrong, once it renders: the buttons sit in the bar pinned to the
 * bottom of the phone, far from it.
 */
export function focusFirstProblem() {
  requestAnimationFrame(() => {
    const first = document.querySelector<HTMLElement>('main [aria-invalid="true"], main [role="alert"]');

    first?.scrollIntoView({ block: 'center' });
    first?.focus({ preventScroll: true });
  });
}

/**
 * Move the screen reader to a new step's heading, once it renders.
 */
export function focusStepHeading() {
  requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }));
}
