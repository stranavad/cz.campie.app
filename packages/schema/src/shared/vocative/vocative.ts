// Women's names ending in a consonant, which stay as they are where a man's name of the same ending changes.
const UNCHANGED = new Set([
  'carmen',
  'dagmar',
  'doris',
  'edit',
  'ester',
  'ingrid',
  'iris',
  'ivet',
  'judit',
  'karin',
  'lilian',
  'margit',
  'miriam',
  'nikol',
  'ráchel',
  'rút',
]);

// Each ending and how it changes, the first that matches applying.
const RULES: readonly (readonly [RegExp, (name: string) => string])[] = [
  [/a$/, (name) => `${name.slice(0, -1)}o`],
  // Zdeněk → Zdeňku: the softness of the dropped ě moves to the consonant before it.
  [/[ndt]ěk$/, (name) => `${name.slice(0, -3)}${{ n: 'ň', d: 'ď', t: 'ť' }[name.at(-3)?.toLowerCase() ?? ''] ?? ''}ku`],
  [/[^aeiouyáéěíóúůý]ek$/, (name) => `${name.slice(0, -2)}ku`],
  [/[^aeiouyáéěíóúůý]r$/, (name) => `${name.slice(0, -1)}ře`],
  [/[vr]el$/, (name) => `${name.slice(0, -2)}le`],
  [/el$/, (name) => `${name}i`],
  [/(?:ch|[khg])$/, (name) => `${name}u`],
  [/[šžčřjcsxz]$/, (name) => `${name}i`],
  [/[bdflmnprtvw]$/, (name) => `${name}e`],
];

/**
 * Call someone by a Czech first name, as a greeting does (Jana → Jano, Petr → Petře, Tomáš → Tomáši). Covers
 * the common patterns only; a name no rule fits, such as one ending in a vowel other than a, stays as it is.
 * @param firstName the first name, in the nominative
 */
export function vocativeOf(firstName: string): string {
  const lower = firstName.toLowerCase();

  if (UNCHANGED.has(lower)) {
    return firstName;
  }

  const rule = RULES.find(([ending]) => ending.test(lower));

  if (rule === undefined) {
    return firstName;
  }

  // The endings are written in lower case, so a name typed in capitals stays in capitals.
  return firstName === firstName.toUpperCase() ? rule[1](lower).toUpperCase() : rule[1](firstName);
}
