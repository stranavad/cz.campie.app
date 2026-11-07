import { z } from 'zod';

import { defineEndpoint, emailSchema, phoneSchema, requiredText } from '@repo/schema/shared';

import { bankAccountSchema } from '../bank-account/bank-account.ts';
import { accentColourSchema } from '../branding/brand-colours.ts';
import { icoSchema } from '../ico/ico.ts';
import { vatIdSchema } from '../vat-id/vat-id.ts';
import { organisationSettingsSchema } from './organisation-settings.resource.ts';

// Every field an Owner sets; the settings forms each take their share of it whole. An empty bank account
// or VAT number removes it.
export const organisationSettingsFieldsSchema = z.object({
  legalName: requiredText(200),
  ico: icoSchema,
  vatId: vatIdSchema,
  address: requiredText(300),
  statutoryRepresentative: requiredText(200),
  bankAccount: z.union([z.literal('').transform(() => null), z.null(), bankAccountSchema]),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  billingEmail: emailSchema,
  displayName: requiredText(120),
  accentColour: accentColourSchema,
});

// What is left out stays as it is, but something must change.
export const updateOrganisationSettingsBodySchema = organisationSettingsFieldsSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'settings_change_empty');

export type UpdateOrganisationSettingsBody = z.infer<typeof updateOrganisationSettingsBodySchema>;

// Changes the current Organisation's settings, audited with old and new values; Owners only.
export const updateOrganisationSettingsEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/organisation-settings',
  body: updateOrganisationSettingsBodySchema,
  response: organisationSettingsSchema,
});
