/**
 * Write a name as it would read in an address: lowercase, without diacritics, every run of other
 * characters as one hyphen, none at either end.
 * @param name the name, such as a Camp's
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}
