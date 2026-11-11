import { isGuardianFieldKey } from '@repo/schema/camps';
import { SECOND_GUARDIAN_FIELDS, type FormField } from '@repo/schema/form-engine';

const SECOND_GUARDIAN_KEYS: ReadonlySet<string> = new Set(SECOND_GUARDIAN_FIELDS);

/**
 * Split the Registration's guardian fields by guardian, each in the form's order.
 * @param fields the Registration's fields
 */
export function guardianFields(fields: readonly FormField[]): { first: FormField[]; second: FormField[] } {
  const guardian = fields.filter(({ key }) => isGuardianFieldKey(key));

  return {
    first: guardian.filter(({ key }) => !SECOND_GUARDIAN_KEYS.has(key)),
    second: guardian.filter(({ key }) => SECOND_GUARDIAN_KEYS.has(key)),
  };
}
