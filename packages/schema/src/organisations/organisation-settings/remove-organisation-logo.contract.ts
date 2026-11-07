import { defineEndpoint } from '@repo/schema/shared';

import { organisationSettingsSchema } from './organisation-settings.resource.ts';

// Removes the Organisation's logo and its file. Owners only.
export const removeOrganisationLogoEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/organisation-settings/logo',
  response: organisationSettingsSchema,
});
