// A new Organisation waits for the Platform operator's approval; a suspended one has its pages offline
// and sends no mail.
export const ORGANISATION_STATUSES = ['pending', 'approved', 'suspended'] as const;

export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];
