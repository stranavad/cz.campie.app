// A gap the platform operator still has to fill in a draft, such as "[doplní provozovatel: IČO]".
const PLACEHOLDER = /(\[doplní provozovatel[^\]]*\])/;

/**
 * Split a text into plain parts and the placeholders between them, in order.
 * @param text a paragraph of a legal text
 */
export function splitPlaceholders(text: string): { text: string; placeholder: boolean }[] {
  return text
    .split(PLACEHOLDER)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, placeholder: PLACEHOLDER.test(part) }));
}
