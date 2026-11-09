import {
  CONSOLE_SECTION_SLUGS,
  CONSOLE_SECTIONS,
  type ConsoleSection,
  type ConsoleSectionSlug,
} from '@/features/console/components/console-section.constant';

/**
 * Read the open tab from the address.
 * @param slug the `sekce` search parameter, if any
 * @returns its tab, the Organisations without one
 */
export function consoleSectionOf(slug: ConsoleSectionSlug | undefined): ConsoleSection {
  return CONSOLE_SECTIONS.find((section) => CONSOLE_SECTION_SLUGS[section] === slug) ?? 'organisations';
}
