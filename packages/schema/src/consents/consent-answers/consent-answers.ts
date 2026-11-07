import type { ConsentItem } from '../consent/consent.resource.ts';

// A signer's answer per item id: agreement to a must-agree item, yes or no to a yes/no one.
export type ConsentAnswers = Readonly<Record<string, boolean>>;

export const CONSENT_ANSWER_ERROR_CODES = [
  'consent_answer_unexpected',
  'consent_answer_missing',
  'consent_agreement_required',
] as const;

export type ConsentAnswerErrorCode = (typeof CONSENT_ANSWER_ERROR_CODES)[number];

export interface ConsentAnswerError {
  readonly itemId: string;
  readonly code: ConsentAnswerErrorCode;
}

/**
 * Check a signer's answers against a version's items: an information item takes none, a must-agree item
 * takes agreement, a yes/no item either answer; an answer to no item of the version is refused too.
 * @param items the version's items
 * @param answers the answers by item id
 */
export function checkConsentAnswers(items: readonly ConsentItem[], answers: ConsentAnswers): ConsentAnswerError[] {
  const errors: ConsentAnswerError[] = [];

  for (const item of items) {
    const answer = Object.hasOwn(answers, item.id) ? answers[item.id] : undefined;

    if (item.kind === 'information' && answer !== undefined) {
      errors.push({ itemId: item.id, code: 'consent_answer_unexpected' });
    } else if (item.kind !== 'information' && answer === undefined) {
      errors.push({ itemId: item.id, code: 'consent_answer_missing' });
    } else if (item.kind === 'must_agree' && answer === false) {
      errors.push({ itemId: item.id, code: 'consent_agreement_required' });
    }
  }

  for (const itemId of Object.keys(answers)) {
    if (!items.some(({ id }) => id === itemId)) {
      errors.push({ itemId, code: 'consent_answer_unexpected' });
    }
  }

  return errors;
}
