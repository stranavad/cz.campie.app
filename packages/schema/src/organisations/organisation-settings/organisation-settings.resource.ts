import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';

// What an Owner keeps of the Organisation: the legal identity and bank account that generated documents
// and payment instructions carry, the contacts, and the branding.
export const organisationSettingsSchema = z.object({
  legalName: z.string(),
  ico: z.string(),
  vatId: z.string().nullable(),
  address: z.string(),
  statutoryRepresentative: z.string(),
  // Domestic form, prefix-number/bank code; null until the Owner enters one.
  bankAccount: z.string().nullable(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  billingEmail: z.string(),
  displayName: z.string(),
  accentColour: z.string(),
  logo: fileLinkSchema.nullable(),
});

export type OrganisationSettings = z.infer<typeof organisationSettingsSchema>;
