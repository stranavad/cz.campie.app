import { z } from 'zod';

import { defineEndpoint, emailSchema, passwordSchema, phoneSchema, requiredText } from '@repo/schema/shared';

import { icoSchema } from '../ico/ico.ts';

// A Czech VAT number, entered only by a VAT payer; empty or null means none. Its output parses again, so
// the app can send what its form parsed.
const vatIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => value === '' || /^CZ\d{8,10}$/.test(value), 'vat_id_invalid')
  .nullable()
  .transform((value) => (value === '' ? null : value));

export const signUpOrganisationBodySchema = z.object({
  // The legal identity, as in the business register.
  legalName: requiredText(200),
  ico: icoSchema,
  vatId: vatIdSchema,
  address: requiredText(300),
  statutoryRepresentative: requiredText(200),
  // Where the Platform operator reaches the Organisation, and where its invoices go.
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  billingEmail: emailSchema,
  // The first Camp, created with the Organisation; its name is also the Organisation's display name.
  campName: requiredText(120),
  // Checked against the format, the reserved names and the taken ones by the API, with a code each.
  subdomain: z.string().trim().toLowerCase(),
  // The first Owner's sign-in.
  email: emailSchema,
  password: passwordSchema,
  // The versions of the terms and the data processing agreement the Owner saw and accepted.
  acceptedVersions: z.object({
    terms: z.string(),
    data_processing_agreement: z.string(),
  }),
});

export type SignUpOrganisationBody = z.infer<typeof signUpOrganisationBodySchema>;

// Codes of a refused signup besides the subdomain's, which the app translates.
export const SIGN_UP_ERROR_CODES = ['email_taken', 'legal_versions_outdated'] as const;

export type SignUpErrorCode = (typeof SIGN_UP_ERROR_CODES)[number];

// Creates the Organisation, pending approval, and signs its first Owner in.
export const signUpOrganisationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/organisations',
  body: signUpOrganisationBodySchema,
});
