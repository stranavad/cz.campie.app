import { z } from 'zod';

// Whether a field is answered once per Registration or once per child.
export const FIELD_SCOPES = ['registration', 'participant'] as const;

export type FieldScope = (typeof FIELD_SCOPES)[number];

export const STANDARD_FIELD_STATES = ['off', 'optional', 'required'] as const;

export type StandardFieldState = (typeof STANDARD_FIELD_STATES)[number];

export const CUSTOM_FIELD_TYPES = [
  'short_text',
  'long_text',
  'single_choice',
  'multiple_choice',
  'yes_no',
  'number',
  'date',
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

// The locked core every registration form asks, in its fixed order: the child's on each Participant, the
// guardian's once, and an optional second guardian, whose name and email are needed once any of theirs is
// given.
export const CORE_FIELDS = [
  { key: 'firstName', scope: 'participant', required: true },
  { key: 'lastName', scope: 'participant', required: true },
  { key: 'birthDate', scope: 'participant', required: true },
  { key: 'guardianFirstName', scope: 'registration', required: true },
  { key: 'guardianLastName', scope: 'registration', required: true },
  { key: 'guardianEmail', scope: 'registration', required: true },
  { key: 'guardianPhone', scope: 'registration', required: true },
  { key: 'secondGuardianFirstName', scope: 'registration', required: false },
  { key: 'secondGuardianLastName', scope: 'registration', required: false },
  { key: 'secondGuardianEmail', scope: 'registration', required: false },
  { key: 'secondGuardianPhone', scope: 'registration', required: false },
] as const satisfies readonly { key: string; scope: FieldScope; required: boolean }[];

// The second guardian's fields, and those of them needed once any is given.
export const SECOND_GUARDIAN_FIELDS = [
  'secondGuardianFirstName',
  'secondGuardianLastName',
  'secondGuardianEmail',
  'secondGuardianPhone',
] as const;
export const SECOND_GUARDIAN_NEEDED = [
  'secondGuardianFirstName',
  'secondGuardianLastName',
  'secondGuardianEmail',
] as const;

export type CoreFieldKey = (typeof CORE_FIELDS)[number]['key'];

/**
 * Name the i18n key a core field's label and column are translated by.
 * @param key the core field
 */
export function coreLabelKey(key: CoreFieldKey): string {
  return `form.core.${key}`;
}

// An answer as the form sends it: text, a number, yes or no, the chosen option ids, or nothing.
export const answerValueSchema = z.union([
  z.string().max(10_000),
  z.number(),
  z.boolean(),
  z.array(z.string().max(100)).max(50),
  z.null(),
]);

export type AnswerValue = z.infer<typeof answerValueSchema>;

export type Answers = Readonly<Record<string, AnswerValue>>;

export const FORM_ANSWER_ERROR_CODES = [
  'form_answer_required',
  'form_answer_invalid',
  'form_answer_too_long',
  'form_answer_unknown',
  'form_participants_required',
  'form_birth_number_mismatch',
] as const;

export type FormAnswerErrorCode = (typeof FORM_ANSWER_ERROR_CODES)[number];

// How sensitive an answer is: plain is stored as it is; encrypted is stored encrypted (rodné číslo);
// health is health data, stored encrypted, shown only with Health read and never printed on the Přihláška.
export const FIELD_SENSITIVITIES = ['plain', 'encrypted', 'health'] as const;

export type FieldSensitivity = (typeof FIELD_SENSITIVITIES)[number];

// The keys whose answers are not plain, with their sensitivity.
export type SensitiveKeys = ReadonlyMap<string, Exclude<FieldSensitivity, 'plain'>>;

// How a standard field is filled in: text on one line or several, a rodné číslo, one of the platform's
// options, or one of the platform's options and those the camp gives the field in its form (boarding
// places).
export const STANDARD_INPUTS = ['text', 'long_text', 'birth_number', 'choice', 'camp_choice'] as const;

export type StandardInput = (typeof STANDARD_INPUTS)[number];

// An option the platform offers, named by an i18n key.
export interface PlatformOption {
  readonly value: string;
  readonly labelKey: string;
}

interface StandardFieldBase {
  readonly scope: FieldScope;
  readonly labelKey: string;
  readonly sensitivity: FieldSensitivity;
  // A check of a valid answer against the other answers of its scope, such as a rodné číslo against the
  // birth date: the error, or null when they agree or the other answer is missing.
  readonly agrees?: (value: AnswerValue, answers: Answers) => FormAnswerErrorCode | null;
}

// A standard field's platform-known meaning: where it is answered, its name for the app to translate, how
// it is filled in and checked, and how sensitive its answer is. The platform's catalogue supplies them by
// stable key.
export type StandardFieldSpec =
  | (StandardFieldBase & { readonly input: 'text' | 'long_text' | 'birth_number'; readonly schema: z.ZodType })
  | (StandardFieldBase & { readonly input: 'choice' | 'camp_choice'; readonly options: readonly PlatformOption[] });

export type StandardFieldCatalogue = Readonly<Record<string, StandardFieldSpec>>;

// An option a camp gives a standard field in its form, such as a boarding place.
export const campOptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  label: z.string().trim().min(1).max(200),
});

export type CampOption = z.infer<typeof campOptionSchema>;

// A per-child amount a choice or a yes adds (Paid extra) or takes off (Claimed discount, which may need
// the camp to verify it), in whole CZK.
const surchargeSchema = z.number().int().min(-1_000_000).max(1_000_000).nullable();

const choiceOptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  label: z.string().trim().min(1).max(200),
  surcharge: surchargeSchema,
  needsVerification: z.boolean(),
});

export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

const customFieldBase = {
  id: z.uuid(),
  label: z.string().trim().min(1).max(200),
  hint: z.string().trim().max(500).nullable(),
  required: z.boolean(),
  scope: z.enum(FIELD_SCOPES),
  // Health data: stored encrypted like the health note, shown only with Health read, never printed on the
  // Přihláška, and without a surcharge, so no price line tells it.
  health: z.boolean(),
};

export const customFieldSchema = z.discriminatedUnion('type', [
  z.object({ ...customFieldBase, type: z.enum(['short_text', 'long_text', 'number', 'date']) }),
  z.object({
    ...customFieldBase,
    type: z.enum(['single_choice', 'multiple_choice']),
    options: z.array(choiceOptionSchema).min(1).max(50),
  }),
  z.object({
    ...customFieldBase,
    type: z.literal('yes_no'),
    // Added or taken off for a yes.
    surcharge: surchargeSchema,
    needsVerification: z.boolean(),
  }),
]);

export type CustomField = z.infer<typeof customFieldSchema>;

// Codes of a definition that does not hold together, which the form builder translates.
export const FORM_DEFINITION_ERROR_CODES = [
  'form_field_unknown',
  'form_field_duplicate',
  'form_option_duplicate',
  'form_verification_without_discount',
  'form_health_surcharge',
] as const;

const MAX_STANDARD_FIELDS = 100;
const MAX_CUSTOM_FIELDS = 200;
const MAX_CAMP_OPTIONS = 50;

const standardEntrySchema = z.object({
  key: z.string(),
  state: z.enum(STANDARD_FIELD_STATES),
  // The camp's own options of a field that takes them, such as its boarding places.
  options: z.array(campOptionSchema).max(MAX_CAMP_OPTIONS).optional(),
});

// A form definition's shape: the standard fields it switches, then its custom fields in their order. The
// core is locked, so no definition names it.
export const formDefinitionShape = z.object({
  standard: z.array(standardEntrySchema).max(MAX_STANDARD_FIELDS),
  custom: z.array(customFieldSchema).max(MAX_CUSTOM_FIELDS),
});

export type FormDefinition = z.infer<typeof formDefinitionShape>;

/**
 * Tell whether a custom field can change the price: a yes or an option with a surcharge.
 * @param field the field
 */
function hasSurcharge(field: CustomField): boolean {
  switch (field.type) {
    case 'yes_no':
      return (field.surcharge ?? 0) !== 0;
    case 'single_choice':
    case 'multiple_choice':
      return field.options.some(({ surcharge }) => (surcharge ?? 0) !== 0);
    case 'short_text':
    case 'long_text':
    case 'number':
    case 'date':
      return false;
  }
}

/**
 * Build the schema of a form definition for a catalogue: the standard fields it switches, then its custom
 * fields in their order. The core is locked, so no definition names it.
 * @param catalogue the standard fields the platform knows
 */
export function formDefinitionSchema(catalogue: StandardFieldCatalogue) {
  const coreKeys = new Set<string>(CORE_FIELDS.map(({ key }) => key));

  return formDefinitionShape
    .extend({
      standard: z
        .array(
          standardEntrySchema.extend({
            key: z.string().refine((key) => Object.hasOwn(catalogue, key) && !coreKeys.has(key), 'form_field_unknown'),
          }),
        )
        .max(MAX_STANDARD_FIELDS),
    })
    .superRefine((definition, context) => {
      const problem = (path: (string | number)[], message: (typeof FORM_DEFINITION_ERROR_CODES)[number]) =>
        context.addIssue({ code: 'custom', path, message });
      const keys = new Set<string>();

      for (const [index, { key, options }] of definition.standard.entries()) {
        if (keys.has(key)) {
          problem(['standard', index, 'key'], 'form_field_duplicate');
        }

        keys.add(key);

        const spec = Object.hasOwn(catalogue, key) ? catalogue[key] : undefined;

        if (options === undefined || spec === undefined) {
          continue;
        }

        if (spec.input !== 'camp_choice') {
          problem(['standard', index, 'options'], 'form_field_unknown');
          continue;
        }

        // The camp's options sit beside the platform's under one answer, so no two may share a value.
        const values = new Set(spec.options.map(({ value }) => value));

        for (const [optionIndex, { id }] of options.entries()) {
          if (values.has(id)) {
            problem(['standard', index, 'options', optionIndex, 'id'], 'form_option_duplicate');
          }

          values.add(id);
        }
      }

      for (const [index, field] of definition.custom.entries()) {
        if (keys.has(field.id)) {
          problem(['custom', index, 'id'], 'form_field_duplicate');
        }

        keys.add(field.id);

        if (field.health && hasSurcharge(field)) {
          problem(['custom', index, 'health'], 'form_health_surcharge');
        }

        if (field.type === 'yes_no' && field.needsVerification && (field.surcharge ?? 0) >= 0) {
          problem(['custom', index, 'needsVerification'], 'form_verification_without_discount');
        }

        if (field.type === 'single_choice' || field.type === 'multiple_choice') {
          const optionIds = new Set<string>();

          for (const [optionIndex, option] of field.options.entries()) {
            if (optionIds.has(option.id)) {
              problem(['custom', index, 'options', optionIndex, 'id'], 'form_option_duplicate');
            }

            optionIds.add(option.id);

            if (option.needsVerification && (option.surcharge ?? 0) >= 0) {
              problem(
                ['custom', index, 'options', optionIndex, 'needsVerification'],
                'form_verification_without_discount',
              );
            }
          }
        }
      }
    });
}

/**
 * Map the keys of answers that are not plain to their sensitivity: the catalogue's encrypted and health
 * fields, and every custom field a version marks as health data. A custom field keeps its health mark
 * across versions, so any version that asks it tells.
 * @param definitions the form's versions
 * @param catalogue the standard fields the platform knows
 */
export function sensitiveKeys(
  definitions: readonly FormDefinition[],
  catalogue: StandardFieldCatalogue,
): SensitiveKeys {
  const keys = new Map<string, Exclude<FieldSensitivity, 'plain'>>();

  for (const [key, spec] of Object.entries(catalogue)) {
    if (spec.sensitivity !== 'plain') {
      keys.set(key, spec.sensitivity);
    }
  }

  for (const field of definitions.flatMap(({ custom }) => custom)) {
    if (field.health) {
      keys.set(field.id, 'health');
    }
  }

  return keys;
}
