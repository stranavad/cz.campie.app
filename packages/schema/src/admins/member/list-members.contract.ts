import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { memberSchema } from './member.resource.ts';

// Every member of the current Organisation; Owners only.
export const listMembersEndpoint = defineEndpoint({
  method: 'GET',
  path: '/members',
  response: z.array(memberSchema),
});
