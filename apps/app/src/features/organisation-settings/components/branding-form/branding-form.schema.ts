import type { z } from 'zod';

import { organisationSettingsFieldsSchema, type OrganisationSettings } from '@repo/schema/organisations';

// The contract's body for the branding: the name guardians see and the accent colour.
export const brandingFormSchema = organisationSettingsFieldsSchema.pick({ displayName: true, accentColour: true });

export type BrandingFormValues = z.input<typeof brandingFormSchema>;

/**
 * Fill the form from the saved settings.
 * @param settings the Organisation's settings
 */
export function brandingFormValues(settings: OrganisationSettings): BrandingFormValues {
  return { displayName: settings.displayName, accentColour: settings.accentColour };
}
