import { z } from 'zod';

import type {
  Answers,
  AnswerValue,
  FormAnswerErrorCode,
  PlatformOption,
  StandardFieldCatalogue,
} from '@repo/schema/form-engine';

import { parseBirthNumber } from './birth-number.ts';

/**
 * Name a field's platform options by their i18n keys, `form.standard.<field>.options.<value>`.
 * @param field the field's key
 * @param values the options' stored values
 */
function options(field: string, values: readonly string[]): PlatformOption[] {
  return values.map((value) => ({ value, labelKey: `form.standard.${field}.options.${value}` }));
}

const text = (max: number) => z.string().trim().min(1).max(max);

/**
 * Tell whether a rodné číslo agrees with the birth date given beside it.
 * @param value the checked rodné číslo
 * @param answers the child's answers
 */
function birthNumberAgrees(value: AnswerValue, answers: Answers): FormAnswerErrorCode | null {
  const parsed = typeof value === 'string' ? parseBirthNumber(value) : null;
  const birthDate = answers.birthDate;

  return parsed !== null && typeof birthDate === 'string' && parsed.birthDate !== birthDate.trim()
    ? 'form_birth_number_mismatch'
    : null;
}

// The Czech public health insurers by their codes.
const INSURER_CODES = ['111', '201', '205', '207', '209', '211', '213'] as const;

const TSHIRT_SIZES = ['116', '128', '140', '152', '164', 'xs', 's', 'm', 'l', 'xl', 'xxl'] as const;

// A transport answer that is no boarding place: the family brings and fetches the child itself.
const OWN_TRANSPORT = 'own';

// The registration form's standard fields by stable key, never renamed once Registrations exist. Each says
// where it is answered, how it is filled in and checked, and how sensitive it is: the rodné číslo is
// encrypted, the health note is health data. Transport offers own transport and the boarding places the
// Camp gives the field in its form.
export const REGISTRATION_FIELD_CATALOGUE = {
  gender: {
    scope: 'participant',
    labelKey: 'form.standard.gender.label',
    sensitivity: 'plain',
    input: 'choice',
    options: options('gender', ['boy', 'girl']),
  },
  birthNumber: {
    scope: 'participant',
    labelKey: 'form.standard.birthNumber.label',
    sensitivity: 'encrypted',
    input: 'birth_number',
    schema: z.string().transform((value, context) => {
      const parsed = parseBirthNumber(value);

      if (parsed === null) {
        context.addIssue({ code: 'custom', message: 'form_answer_invalid' });

        return z.NEVER;
      }

      return parsed.formatted;
    }),
    agrees: birthNumberAgrees,
  },
  insurer: {
    scope: 'participant',
    labelKey: 'form.standard.insurer.label',
    sensitivity: 'plain',
    input: 'choice',
    options: options('insurer', INSURER_CODES),
  },
  participantAddress: {
    scope: 'participant',
    labelKey: 'form.standard.participantAddress.label',
    sensitivity: 'plain',
    input: 'text',
    schema: text(200),
  },
  tshirtSize: {
    scope: 'participant',
    labelKey: 'form.standard.tshirtSize.label',
    sensitivity: 'plain',
    input: 'choice',
    options: options('tshirtSize', TSHIRT_SIZES),
  },
  healthNote: {
    scope: 'participant',
    labelKey: 'form.standard.healthNote.label',
    sensitivity: 'health',
    input: 'long_text',
    schema: text(2000),
  },
  campFriend: {
    scope: 'participant',
    labelKey: 'form.standard.campFriend.label',
    sensitivity: 'plain',
    input: 'text',
    schema: text(200),
  },
  guardianAddress: {
    scope: 'registration',
    labelKey: 'form.standard.guardianAddress.label',
    sensitivity: 'plain',
    input: 'text',
    schema: text(200),
  },
  transport: {
    scope: 'registration',
    labelKey: 'form.standard.transport.label',
    sensitivity: 'plain',
    input: 'camp_choice',
    options: options('transport', [OWN_TRANSPORT]),
  },
  howDidYouHear: {
    scope: 'registration',
    labelKey: 'form.standard.howDidYouHear.label',
    sensitivity: 'plain',
    input: 'choice',
    options: options('howDidYouHear', ['friends', 'returning', 'internet', 'social', 'school', 'print', 'other']),
  },
} as const satisfies StandardFieldCatalogue;

export type RegistrationFieldKey = keyof typeof REGISTRATION_FIELD_CATALOGUE;

/**
 * Tell whether a key is one of the registration form's standard fields.
 * @param key an answer's key
 */
export function isRegistrationFieldKey(key: string): key is RegistrationFieldKey {
  return Object.hasOwn(REGISTRATION_FIELD_CATALOGUE, key);
}
