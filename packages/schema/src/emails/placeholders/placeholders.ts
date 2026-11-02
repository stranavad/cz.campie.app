// A placeholder is a name in double braces, `{{castka}}`, spaces inside allowed. Anything in double
// braces counts, malformed names included, so a typo is reported on save instead of reaching a guardian.
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;
// A placeholder, or a double brace outside one: what is left of a placeholder that lost a brace.
const PLACEHOLDER_OR_STRAY_BRACES = /\{\{\s*([^{}]*?)\s*\}\}|\{\{|\}\}/g;

/**
 * Replace each placeholder of an email text with its value. A placeholder without a value stays as
 * written; texts are checked with unknownPlaceholders when saved, so only a missed check leaves one.
 * @param text the text as an admin wrote it
 * @param values the value of each known placeholder
 */
export function fillPlaceholders(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(PLACEHOLDER, (written, name: string) =>
    Object.hasOwn(values, name) ? (values[name] ?? written) : written,
  );
}

/**
 * List the placeholders of an email text that are not known, each once and in the order written; a
 * stray double brace is listed as itself.
 * @param text the text as an admin wrote it
 * @param known the placeholders the email type offers
 */
export function unknownPlaceholders(text: string, known: readonly string[]): string[] {
  const unknown = new Set<string>();

  for (const [written, name] of text.matchAll(PLACEHOLDER_OR_STRAY_BRACES)) {
    if (name === undefined) {
      unknown.add(written);
    } else if (!known.includes(name)) {
      unknown.add(name);
    }
  }

  return [...unknown];
}
