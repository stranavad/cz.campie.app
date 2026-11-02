// A new Organisation waits for the Platform operator's approval; a suspended one has its pages offline
// and sends no mail.
export const ORGANISATION_STATUSES = ['pending', 'approved', 'suspended'] as const;

export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];

// The accent colour of an Organisation that has not chosen one, and of the platform's own mail.
export const DEFAULT_ACCENT_COLOUR = '#2b8a4e';
