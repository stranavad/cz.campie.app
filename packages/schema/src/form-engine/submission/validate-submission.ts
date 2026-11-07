import { z } from 'zod';

import { emailSchema, phoneSchema } from '@repo/schema/shared';

import {
  CORE_FIELDS,
  coreLabelKey,
  SECOND_GUARDIAN_FIELDS,
  SECOND_GUARDIAN_NEEDED,
  type CoreFieldKey,
  type CustomField,
  type FieldScope,
  type FormDefinition,
  type StandardFieldCatalogue,
  type StandardFieldSpec,
} from '../definition/form-definition.ts';

// Bounds that hold whatever the form, so a crafted submission cannot make checking it expensive.
const MAX_ANSWER_TEXT = 10_000;
const MAX_CHOSEN = 50;
const MAX_ANSWERS = 300;
// Above any Camp's own limit per Registration, which placement checks.
const MAX_PARTICIPANTS = 20;

// An answer as the form sends it: text, a number, yes or no, the chosen option ids, or nothing.
export const answerValueSchema = z.union([
  z.string().max(MAX_ANSWER_TEXT),
  z.number(),
  z.boolean(),
  z.array(z.string().max(100)).max(MAX_CHOSEN),
  z.null(),
]);

export type AnswerValue = z.infer<typeof answerValueSchema>;

export type Answers = Readonly<Record<string, AnswerValue>>;

export interface Submission {
  // Answered once: the guardian's core and every per-Registration field.
  readonly registration: Answers;
  // One per child, in order.
  readonly participants: readonly Answers[];
}

export const FORM_ANSWER_ERROR_CODES = [
  'form_answer_required',
  'form_answer_invalid',
  'form_answer_too_long',
  'form_answer_unknown',
  'form_participants_required',
] as const;

export type FormAnswerErrorCode = (typeof FORM_ANSWER_ERROR_CODES)[number];

// A field-level error: where, an i18n key, and what the key's text needs.
export interface FormAnswerError {
  readonly path: readonly (string | number)[];
  readonly code: FormAnswerErrorCode;
  readonly params?: Readonly<Record<string, number>>;
}

const SHORT_TEXT_MAX = 200;
const LONG_TEXT_MAX = 5000;
const NAME_MAX = 100;

type Check =
  | { readonly ok: true; readonly value: AnswerValue }
  | { readonly ok: false; readonly error: Omit<FormAnswerError, 'path'> };

const invalid: Check = { ok: false, error: { code: 'form_answer_invalid' } };

/**
 * Check text against a length.
 * @param value the answer
 * @param max the most characters it may have
 */
function text(value: AnswerValue, max: number): Check {
  if (typeof value !== 'string') {
    return invalid;
  }

  const trimmed = value.trim();

  return trimmed.length > max
    ? { ok: false, error: { code: 'form_answer_too_long', params: { max } } }
    : { ok: true, value: trimmed };
}

/**
 * Check an answer with a schema, keeping what it parses to.
 * @param value the answer
 * @param schema the schema
 */
function bySchema(value: AnswerValue, schema: z.ZodType): Check {
  const result = schema.safeParse(value);

  return result.success ? { ok: true, value: result.data as AnswerValue } : invalid;
}

// A real calendar date since 1900, as a date input writes it.
function calendarDate(value: AnswerValue): Check {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return invalid;
  }

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return real && year >= 1900 ? { ok: true, value } : invalid;
}

const CORE_CHECKS: Readonly<Record<(typeof CORE_FIELDS)[number]['key'], (value: AnswerValue) => Check>> = {
  firstName: (value) => text(value, NAME_MAX),
  lastName: (value) => text(value, NAME_MAX),
  birthDate: calendarDate,
  guardianFirstName: (value) => text(value, NAME_MAX),
  guardianLastName: (value) => text(value, NAME_MAX),
  guardianEmail: (value) => bySchema(value, emailSchema),
  guardianPhone: (value) => bySchema(value, phoneSchema),
  secondGuardianFirstName: (value) => text(value, NAME_MAX),
  secondGuardianLastName: (value) => text(value, NAME_MAX),
  secondGuardianEmail: (value) => bySchema(value, emailSchema),
  secondGuardianPhone: (value) => bySchema(value, phoneSchema),
};

/**
 * Check a custom field's answer by its type.
 * @param field the field
 * @param value the answer, not empty
 */
function customCheck(field: CustomField, value: AnswerValue): Check {
  switch (field.type) {
    case 'short_text':
      return text(value, SHORT_TEXT_MAX);
    case 'long_text':
      return text(value, LONG_TEXT_MAX);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? { ok: true, value } : invalid;
    case 'date':
      return calendarDate(value);
    case 'yes_no':
      return typeof value === 'boolean' ? { ok: true, value } : invalid;
    case 'single_choice':
      return typeof value === 'string' && field.options.some(({ id }) => id === value) ? { ok: true, value } : invalid;
    case 'multiple_choice': {
      const known = new Set(field.options.map(({ id }) => id));

      return Array.isArray(value) && new Set(value).size === value.length && value.every((id) => known.has(id))
        ? { ok: true, value }
        : invalid;
    }
  }
}

/**
 * Tell whether an answer says nothing: missing, null, blank text or no option chosen.
 * @param value the answer
 */
function isEmpty(value: AnswerValue | undefined): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

// A field as the form shows it: core and standard ones named by an i18n key, custom ones carrying their
// definition (type, label, options).
export type FormField =
  | {
      readonly tier: 'core';
      readonly key: CoreFieldKey;
      readonly scope: FieldScope;
      readonly required: boolean;
      readonly labelKey: string;
    }
  | {
      readonly tier: 'standard';
      readonly key: string;
      readonly scope: FieldScope;
      readonly required: boolean;
      readonly labelKey: string;
      readonly spec: StandardFieldSpec;
    }
  | {
      readonly tier: 'custom';
      readonly key: string;
      readonly scope: FieldScope;
      readonly required: boolean;
      readonly field: CustomField;
    };

/**
 * List the fields a form asks in a scope, in its fixed order: the core, the standard fields switched on,
 * then the custom fields in the camp's order. A standard field switched off is not among them.
 * @param definition the form
 * @param catalogue the standard fields the platform knows
 * @param scope once per Registration or per child
 */
export function formFields(
  definition: FormDefinition,
  catalogue: StandardFieldCatalogue,
  scope: FieldScope,
): FormField[] {
  const core: FormField[] = CORE_FIELDS.filter((field) => field.scope === scope).map(({ key, required }) => ({
    tier: 'core',
    key,
    scope,
    required,
    labelKey: coreLabelKey(key),
  }));
  const standard: FormField[] = definition.standard.flatMap(({ key, state }) => {
    const spec = Object.hasOwn(catalogue, key) ? catalogue[key] : undefined;

    return spec === undefined || state === 'off' || spec.scope !== scope
      ? []
      : [{ tier: 'standard' as const, key, scope, required: state === 'required', labelKey: spec.labelKey, spec }];
  });
  const custom: FormField[] = definition.custom
    .filter((field) => field.scope === scope)
    .map((field) => ({ tier: 'custom', key: field.id, scope, required: field.required, field }));

  return [...core, ...standard, ...custom];
}

/**
 * Check an answer by its field.
 * @param field the field
 * @param value the answer, not empty
 */
function checkField(field: FormField, value: AnswerValue): Check {
  switch (field.tier) {
    case 'core':
      return CORE_CHECKS[field.key](value);
    case 'standard':
      return bySchema(value, field.spec.schema);
    case 'custom':
      return customCheck(field.field, value);
  }
}

/**
 * Tell whether a scope's fields include a key.
 * @param fields the scope's fields
 * @param key the key
 */
function asks(fields: readonly FormField[], key: string): boolean {
  return fields.some((field) => field.key === key);
}

/**
 * Check one scope's answers: every required field answered, every answer valid for its field, no answer
 * to a field the scope does not ask.
 * @param fields the scope's fields
 * @param answers the answers
 * @param path where the answers sit in the submission
 */
function checkAnswers(
  fields: readonly FormField[],
  answers: Answers,
  path: readonly (string | number)[],
): { errors: FormAnswerError[]; value: Record<string, AnswerValue> } {
  const errors: FormAnswerError[] = [];
  const value: Record<string, AnswerValue> = {};

  for (const field of fields) {
    const answer = answers[field.key];

    if (isEmpty(answer)) {
      if (field.required) {
        errors.push({ path: [...path, field.key], code: 'form_answer_required' });
      }

      continue;
    }

    const checked = checkField(field, answer ?? null);

    if (checked.ok) {
      value[field.key] = checked.value;
    } else {
      errors.push({ path: [...path, field.key], ...checked.error });
    }
  }

  // A second guardian, once named at all, needs a name and an email to be reached.
  if (SECOND_GUARDIAN_FIELDS.some((key) => asks(fields, key) && !isEmpty(answers[key]))) {
    for (const key of SECOND_GUARDIAN_NEEDED) {
      if (isEmpty(answers[key])) {
        errors.push({ path: [...path, key], code: 'form_answer_required' });
      }
    }
  }

  const known = new Set(fields.map(({ key }) => key));

  for (const key of Object.keys(answers)) {
    if (!known.has(key)) {
      errors.push({ path: [...path, key], code: 'form_answer_unknown' });
    }
  }

  return { errors, value };
}

/**
 * Check answers to some of a form's fields, as an edit after submission sends them: each answer valid for
 * its field, none to a field not offered. Nothing is required; an emptied answer comes back as null, to
 * clear it.
 * @param fields the fields that may be answered
 * @param answers the answers sent
 * @param path where the answers sit in the request
 */
export function checkAnswersTo(
  fields: readonly FormField[],
  answers: Answers,
  path: readonly (string | number)[],
): { errors: FormAnswerError[]; value: Record<string, AnswerValue> } {
  const errors: FormAnswerError[] = [];
  const value: Record<string, AnswerValue> = {};

  for (const [key, answer] of Object.entries(answers)) {
    const field = fields.find((candidate) => candidate.key === key);

    if (field === undefined) {
      errors.push({ path: [...path, key], code: 'form_answer_unknown' });
      continue;
    }

    if (isEmpty(answer)) {
      value[key] = null;
      continue;
    }

    const checked = checkField(field, answer);

    if (checked.ok) {
      value[key] = checked.value;
    } else {
      errors.push({ path: [...path, key], ...checked.error });
    }
  }

  return { errors, value };
}

/**
 * Check a submission against a form definition and normalise it: text trimmed, the email lowercased,
 * empty answers dropped.
 * @param definition the form
 * @param catalogue the standard fields the platform knows
 * @param submission the answers
 */
export function checkSubmission(
  definition: FormDefinition,
  catalogue: StandardFieldCatalogue,
  submission: Submission,
): { errors: FormAnswerError[]; value: Submission } {
  const registration = checkAnswers(formFields(definition, catalogue, 'registration'), submission.registration, [
    'registration',
  ]);
  const participantFields = formFields(definition, catalogue, 'participant');
  const participants = submission.participants.map((answers, index) =>
    checkAnswers(participantFields, answers, ['participants', index]),
  );
  const none: FormAnswerError[] =
    submission.participants.length === 0 ? [{ path: ['participants'], code: 'form_participants_required' }] : [];

  return {
    errors: [...registration.errors, ...none, ...participants.flatMap(({ errors }) => errors)],
    value: { registration: registration.value, participants: participants.map(({ value }) => value) },
  };
}

/**
 * Build the Zod schema of a form's submissions, for the API: it reports each field-level error as an issue
 * whose message is the i18n key, with its params, and parses to the normalised submission.
 * @param definition the form
 * @param catalogue the standard fields the platform knows
 */
export function submissionSchema(definition: FormDefinition, catalogue: StandardFieldCatalogue) {
  const answers = z
    .record(z.string().max(100), answerValueSchema)
    .refine((record) => Object.keys(record).length <= MAX_ANSWERS, 'form_answers_too_many');

  return z
    .object({ registration: answers, participants: z.array(answers).max(MAX_PARTICIPANTS) })
    .transform((submission, context) => {
      const { errors, value } = checkSubmission(definition, catalogue, submission);

      for (const { path, code, params } of errors) {
        context.addIssue({
          code: 'custom',
          path: [...path],
          message: code,
          ...(params === undefined ? {} : { params }),
        });
      }

      return errors.length === 0 ? value : z.NEVER;
    });
}
