/**
 * Read a typed colour: a code typed without its hash gets one.
 * @param text the input's text
 */
export function typedColour(text: string): string {
  const trimmed = text.trim();

  return trimmed === '' || trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
