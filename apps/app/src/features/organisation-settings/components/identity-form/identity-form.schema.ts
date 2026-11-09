import type { z } from 'zod';

import { organisationSettingsFieldsSchema, type OrganisationSettings } from '@repo/schema/organisations';

// The contract's body, every field present: the legal identity and contacts.
export const identityFormSchema = organisationSettingsFieldsSchema.omit({
  displayName: true,
  accentColour: true,
  bankAccount: true,
});

export type IdentityFormValues = z.input<typeof identityFormSchema>;

/**
 * Fill the form from the saved settings.
 * @param settings the Organisation's settings
 */
export function identityFormValues(settings: OrganisationSettings): IdentityFormValues {
  return {
    legalName: settings.legalName,
    ico: settings.ico,
    vatId: settings.vatId ?? '',
    address: settings.address,
    statutoryRepresentative: settings.statutoryRepresentative,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    billingEmail: settings.billingEmail,
  };
}
