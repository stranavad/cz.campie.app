import { surchargesOf, type Answers, type FormDefinition } from '@repo/schema/form-engine';

import type { ClaimedDiscountVerification } from '../../../repositories/registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';

export interface ClaimedDiscount {
  readonly fieldId: string;
  readonly optionId: string | null;
  readonly label: string;
  readonly amount: number;
  readonly verifiedAt: Date | null;
}

/**
 * Merge the form a Registration was submitted under with fields added to it later, which a guardian may
 * have answered since: every field its answers can belong to.
 * @param version the Registration's version
 * @param latest the latest version
 */
export function answeredDefinition(version: FormDefinition, latest: FormDefinition): FormDefinition {
  return {
    standard: version.standard,
    custom: [...version.custom, ...latest.custom.filter(({ id }) => !version.custom.some((field) => field.id === id))],
  };
}

/**
 * List a Participant's Claimed discounts that need the camp's verification, each with when it was
 * confirmed, if it was.
 * @param definition every field the answers can belong to
 * @param registrationAnswers the Registration's answers
 * @param participant the Participant's id and answers
 * @param verifications the confirmed Claimed discounts
 */
export function claimedDiscountsOf(
  definition: FormDefinition,
  registrationAnswers: Answers,
  participant: { readonly id: string; readonly answers: Answers },
  verifications: readonly ClaimedDiscountVerification[],
): ClaimedDiscount[] {
  const [surcharges] = surchargesOf(definition, {
    registration: registrationAnswers,
    participants: [participant.answers],
  });

  return (surcharges?.surcharges ?? [])
    .filter(({ amount, needsVerification }) => amount < 0 && needsVerification)
    .map(({ fieldId, optionId, label, amount }) => ({
      fieldId,
      optionId,
      label,
      amount,
      verifiedAt:
        verifications.find(
          (verification) =>
            verification.participantId === participant.id &&
            verification.fieldId === fieldId &&
            verification.optionId === (optionId ?? ''),
        )?.verifiedAt ?? null,
    }));
}
