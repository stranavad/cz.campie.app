const list = new Intl.ListFormat('cs', { type: 'conjunction' });

/**
 * Join names as Czech lists them: "Ema, Jan a Petr".
 * @param names the names, in order
 */
export function joinNames(names: readonly string[]): string {
  return list.format(names);
}
