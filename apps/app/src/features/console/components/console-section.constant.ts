// The console's tabs: Organisations, problem reports, mail delivery and support access.
export const CONSOLE_SECTIONS = ['organisations', 'reports', 'mail', 'support'] as const;

export type ConsoleSection = (typeof CONSOLE_SECTIONS)[number];

// Each tab's `sekce` in the address, which is Czech like every public path.
export const CONSOLE_SECTION_SLUGS = {
  organisations: 'organizace',
  reports: 'hlaseni',
  mail: 'emaily',
  support: 'podpora',
} as const satisfies Record<ConsoleSection, string>;

export type ConsoleSectionSlug = (typeof CONSOLE_SECTION_SLUGS)[ConsoleSection];
