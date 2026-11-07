// Why the mail provider reported an address undeliverable: a hard bounce, or the recipient marked a
// message as spam.
export const UNDELIVERABLE_REASONS = ['bounce', 'complaint'] as const;

export type UndeliverableReason = (typeof UNDELIVERABLE_REASONS)[number];
