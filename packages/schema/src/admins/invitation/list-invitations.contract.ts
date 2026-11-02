import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { invitationSchema } from './invitation.resource.ts';

// The current Organisation's invitations not yet accepted; Owners only.
export const listInvitationsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/invitations',
  response: z.array(invitationSchema),
});
