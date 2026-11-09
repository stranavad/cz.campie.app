import type { z } from 'zod';

import { organisationSettingsFieldsSchema, type OrganisationSettings } from '@repo/schema/organisations';

// The contract's body for the bank account guardians pay to; empty removes it.
export const bankAccountFormSchema = organisationSettingsFieldsSchema.pick({ bankAccount: true });

export type BankAccountFormValues = z.input<typeof bankAccountFormSchema>;

/**
 * Fill the form from the saved settings.
 * @param settings the Organisation's settings
 */
export function bankAccountFormValues(settings: OrganisationSettings): BankAccountFormValues {
  return { bankAccount: settings.bankAccount ?? '' };
}
