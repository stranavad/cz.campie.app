import { defineEndpoint } from '@repo/schema/shared';

import { organisationSettingsSchema } from './organisation-settings.resource.ts';

// Replaces the Organisation's logo by an uploaded PNG or JPG of at most MAX_LOGO_BYTES, stored encrypted;
// a rejected file answers with a FileErrorCode. Owners only.
export const setOrganisationLogoEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/organisation-settings/logo',
  upload: true,
  response: organisationSettingsSchema,
});
