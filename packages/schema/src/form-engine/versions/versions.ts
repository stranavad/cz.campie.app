import {
  CORE_FIELDS,
  coreLabelKey,
  type FieldScope,
  type FormDefinition,
  type StandardFieldCatalogue,
} from '../definition/form-definition.ts';

/**
 * List the keys of the fields a version asks beyond the core, in order: standard fields switched on, then
 * custom fields.
 * @param definition the version
 */
function askedKeys(definition: FormDefinition): string[] {
  return [
    ...definition.standard.filter(({ state }) => state !== 'off').map(({ key }) => key),
    ...definition.custom.map(({ id }) => id),
  ];
}

/**
 * Compare two versions of a form: the fields the later one asks that the earlier did not, offered on
 * existing Registrations; those it no longer asks, kept read-only where answered; and custom fields both
 * ask under one id but with another type or scope, whose earlier answers no longer fit them.
 * @param earlier the earlier version
 * @param later the later version
 */
export function diffVersions(
  earlier: FormDefinition,
  later: FormDefinition,
): { added: string[]; removed: string[]; changed: string[] } {
  const before = askedKeys(earlier);
  const after = askedKeys(later);
  const changed = later.custom.flatMap((field) => {
    const previous = earlier.custom.find(({ id }) => id === field.id);

    return previous !== undefined && (previous.type !== field.type || previous.scope !== field.scope) ? [field.id] : [];
  });

  return {
    added: after.filter((key) => !before.includes(key)),
    removed: before.filter((key) => !after.includes(key)),
    changed,
  };
}

export const FIELD_TIERS = ['core', 'standard', 'custom'] as const;

// One column of an export: core and standard columns are named by an i18n key, custom ones by the label
// the camp gave them.
export interface FormColumn {
  readonly key: string;
  readonly tier: (typeof FIELD_TIERS)[number];
  readonly scope: FieldScope;
  readonly label: string | null;
  readonly labelKey: string | null;
  // No longer asked by the latest version; still holds answers given before.
  readonly removed: boolean;
}

/**
 * Derive the export columns of a form from its versions, oldest first: the core, then every field the
 * latest version asks under its latest label, then fields only earlier versions asked, marked removed,
 * newest first.
 * @param versions the form's versions, oldest first
 * @param catalogue the standard fields the platform knows
 */
export function columnCatalogue(versions: readonly FormDefinition[], catalogue: StandardFieldCatalogue): FormColumn[] {
  const core: FormColumn[] = CORE_FIELDS.map(({ key, scope }) => ({
    key,
    tier: 'core',
    scope,
    label: null,
    labelKey: coreLabelKey(key),
    removed: false,
  }));
  const latest = versions.at(-1);
  const latestKeys = new Set(latest === undefined ? [] : askedKeys(latest));
  const seen = new Set<string>();
  const columns: FormColumn[] = [];

  for (const version of versions.toReversed()) {
    const standard = version.standard.filter(({ state }) => state !== 'off');

    for (const { key } of standard) {
      const spec = Object.hasOwn(catalogue, key) ? catalogue[key] : undefined;

      if (spec !== undefined && !seen.has(key)) {
        seen.add(key);
        columns.push({
          key,
          tier: 'standard',
          scope: spec.scope,
          label: null,
          labelKey: spec.labelKey,
          removed: !latestKeys.has(key),
        });
      }
    }

    for (const field of version.custom) {
      if (!seen.has(field.id)) {
        seen.add(field.id);
        columns.push({
          key: field.id,
          tier: 'custom',
          scope: field.scope,
          label: field.label,
          labelKey: null,
          removed: !latestKeys.has(field.id),
        });
      }
    }
  }

  return [...core, ...columns.filter(({ removed }) => !removed), ...columns.filter(({ removed }) => removed)];
}
