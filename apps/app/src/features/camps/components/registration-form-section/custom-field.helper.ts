import type { CustomField, CustomFieldType } from '@repo/schema/form-engine';

import { uuidv7 } from '@/lib/utils';

/**
 * Make a new custom field of a type, with what that type needs and a fresh id.
 * @param type the field's type
 * @param label its label
 */
export function newCustomField(type: CustomFieldType, label: string): CustomField {
  const base = { id: uuidv7(), label, hint: null, required: false, scope: 'participant' as const, health: false };

  switch (type) {
    case 'single_choice':
    case 'multiple_choice':
      return { ...base, type, options: [{ id: 'moznost-1', label: '', surcharge: null, needsVerification: false }] };
    case 'yes_no':
      return { ...base, type, surcharge: null, needsVerification: false };
    case 'short_text':
    case 'long_text':
    case 'number':
    case 'date':
      return { ...base, type };
  }
}

/**
 * Give a new option an id no other option of the field has.
 * @param taken the ids the field's options have
 */
export function nextOptionId(taken: readonly string[]): string {
  let index = taken.length + 1;

  while (taken.includes(`moznost-${index}`)) {
    index += 1;
  }

  return `moznost-${index}`;
}

/**
 * Mark a field as health data or not; health data carries no surcharge, so marking it drops them.
 * @param field the field
 * @param health whether it is health data
 */
export function asHealth(field: CustomField, health: boolean): CustomField {
  if (!health) {
    return { ...field, health };
  }

  switch (field.type) {
    case 'yes_no':
      return { ...field, health, surcharge: null, needsVerification: false };
    case 'single_choice':
    case 'multiple_choice':
      return {
        ...field,
        health,
        options: field.options.map((option) => ({ ...option, surcharge: null, needsVerification: false })),
      };
    case 'short_text':
    case 'long_text':
    case 'number':
    case 'date':
      return { ...field, health };
  }
}

/**
 * Tell whether any answer to a field changes the price.
 * @param field the field
 */
export function hasSurcharge(field: CustomField): boolean {
  switch (field.type) {
    case 'yes_no':
      return field.surcharge !== null;
    case 'single_choice':
    case 'multiple_choice':
      return field.options.some((option) => option.surcharge !== null);
    case 'short_text':
    case 'long_text':
    case 'number':
    case 'date':
      return false;
  }
}
