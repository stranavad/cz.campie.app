// The console's tabs, as the `sekce` search parameter: Organisations, problem reports, mail delivery and
// support access.
export const CONSOLE_SECTIONS = ['organizace', 'hlaseni', 'emaily', 'podpora'] as const;

export type ConsoleSection = (typeof CONSOLE_SECTIONS)[number];
