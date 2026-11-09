import type { ParticipantRow } from '@repo/schema/registrations';

/**
 * Tell whether a child's Consents are not all answered, which is exactly what the unsigned Consent filter
 * finds; false while the Camp has Consents off and for a Cancelled child.
 * @param consents the row's Consent counts
 */
export function hasUnsignedConsent(consents: ParticipantRow['consents']): boolean {
  return consents !== null && consents.signed < consents.required;
}
