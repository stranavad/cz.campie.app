import { defineEndpoint } from '@repo/schema/shared';

import { organisationSettingsSchema } from './organisation-settings.resource.ts';

// The current Organisation's settings; Owners only.
export const getOrganisationSettingsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/organisation-settings',
  response: organisationSettingsSchema,
});
