/**
 * The id a section of a legal text is linked by from the table of contents.
 * @param index the section's position, from 0
 */
export function sectionAnchor(index: number) {
  return `cast-${index + 1}`;
}
