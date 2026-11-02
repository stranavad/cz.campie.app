import { defineEndpoint } from '@repo/schema/shared';

import { accountSchema } from './account.resource.ts';

export const getAccountEndpoint = defineEndpoint({
  method: 'GET',
  path: '/account',
  response: accountSchema,
});
