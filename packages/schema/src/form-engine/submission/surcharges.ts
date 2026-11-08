import type { AnswerValue, CustomField, FormDefinition } from '../definition/form-definition.ts';
import type { Submission } from './validate-submission.ts';

// One answer's amount on one child: positive a Paid extra, negative a Claimed discount. Pricing takes the
// label and amount; the ids and the verification flag let the camp find and confirm a Claimed discount.
export interface Surcharge {
  readonly fieldId: string;
  // The chosen option's id, or null for a yes.
  readonly optionId: string | null;
  readonly label: string;
  readonly amount: number;
  readonly needsVerification: boolean;
}

/**
 * List what one answer adds or takes off per child.
 * @param field the field
 * @param answer the answer, checked against the field
 */
function surchargesOfAnswer(field: CustomField, answer: AnswerValue | undefined): Surcharge[] {
  if (field.type === 'yes_no') {
    return answer === true && field.surcharge !== null && field.surcharge !== 0
      ? [
          {
            fieldId: field.id,
            optionId: null,
            label: field.label,
            amount: field.surcharge,
            needsVerification: field.needsVerification,
          },
        ]
      : [];
  }

  if (field.type !== 'single_choice' && field.type !== 'multiple_choice') {
    return [];
  }

  const chosen = typeof answer === 'string' ? [answer] : Array.isArray(answer) ? answer : [];

  return field.options.flatMap((option) =>
    chosen.includes(option.id) && option.surcharge !== null && option.surcharge !== 0
      ? [
          {
            fieldId: field.id,
            optionId: option.id,
            label: `${field.label}: ${option.label}`,
            amount: option.surcharge,
            needsVerification: option.needsVerification,
          },
        ]
      : [],
  );
}

/**
 * Extract every child's surcharges from a checked submission, in the form's order. A per-Registration
 * answer's surcharge is per child, so it lands on every child.
 * @param definition the form
 * @param submission the answers, checked against the form
 */
export function surchargesOf(definition: FormDefinition, submission: Submission): { surcharges: Surcharge[] }[] {
  return submission.participants.map((answers) => ({
    surcharges: definition.custom.flatMap((field) =>
      surchargesOfAnswer(field, field.scope === 'registration' ? submission.registration[field.id] : answers[field.id]),
    ),
  }));
}

/**
 * List the custom fields whose answers can change the price: a choice with an option that carries a
 * surcharge, or a yes that does. A live price needs only their answers.
 * @param definition the form
 */
export function pricedFieldIds(definition: FormDefinition): string[] {
  return definition.custom.flatMap((field) => {
    if (field.type === 'yes_no') {
      return field.surcharge !== null && field.surcharge !== 0 ? [field.id] : [];
    }

    if (field.type === 'single_choice' || field.type === 'multiple_choice') {
      return field.options.some(({ surcharge }) => surcharge !== null && surcharge !== 0) ? [field.id] : [];
    }

    return [];
  });
}

/**
 * Name a choice answer's options by their labels, as people read it; any other answer stays as it is.
 * @param field the custom field it answered
 * @param value the answer
 */
export function withOptionLabels(field: CustomField, value: AnswerValue): AnswerValue {
  if (field.type !== 'single_choice' && field.type !== 'multiple_choice') {
    return value;
  }

  const labelOf = (id: string) => field.options.find((option) => option.id === id)?.label ?? id;

  return Array.isArray(value) ? value.map(labelOf) : typeof value === 'string' ? labelOf(value) : value;
}
