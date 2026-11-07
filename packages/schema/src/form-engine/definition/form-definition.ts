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

// A standard field's platform-known meaning: where it is answered, its name for the app to translate, and
// how its answer is checked. The platform's catalogue supplies them by stable key.
export interface StandardFieldSpec {
  readonly scope: FieldScope;
  readonly labelKey: string;
  readonly schema: z.ZodType;
}

export type StandardFieldCatalogue = Readonly<Record<string, StandardFieldSpec>>;

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
] as const;

const MAX_STANDARD_FIELDS = 100;
const MAX_CUSTOM_FIELDS = 200;

// A form definition's shape: the standard fields it switches, then its custom fields in their order. The
// core is locked, so no definition names it.
export const formDefinitionShape = z.object({
  standard: z.array(z.object({ key: z.string(), state: z.enum(STANDARD_FIELD_STATES) })).max(MAX_STANDARD_FIELDS),
  custom: z.array(customFieldSchema).max(MAX_CUSTOM_FIELDS),
});

export type FormDefinition = z.infer<typeof formDefinitionShape>;

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
          z.object({
            key: z.string().refine((key) => Object.hasOwn(catalogue, key) && !coreKeys.has(key), 'form_field_unknown'),
            state: z.enum(STANDARD_FIELD_STATES),
          }),
        )
        .max(MAX_STANDARD_FIELDS),
    })
    .superRefine((definition, context) => {
      const problem = (path: (string | number)[], message: (typeof FORM_DEFINITION_ERROR_CODES)[number]) =>
        context.addIssue({ code: 'custom', path, message });
      const keys = new Set<string>();

      for (const [index, { key }] of definition.standard.entries()) {
        if (keys.has(key)) {
          problem(['standard', index, 'key'], 'form_field_duplicate');
        }

        keys.add(key);
      }

      for (const [index, field] of definition.custom.entries()) {
        if (keys.has(field.id)) {
          problem(['custom', index, 'id'], 'form_field_duplicate');
        }

        keys.add(field.id);

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
