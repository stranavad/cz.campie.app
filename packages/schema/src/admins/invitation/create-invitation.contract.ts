import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

import { permissionsSchema } from '../membership/membership.resource.ts';
import { invitationSchema } from './invitation.resource.ts';

export const createInvitationBodySchema = z.object({
  email: emailSchema,
  permissions: permissionsSchema,
});

export type CreateInvitationBody = z.infer<typeof createInvitationBodySchema>;

// Emails an invitation link from the auth stream. Inviting an address again replaces its earlier
// invitation, levels and link; Owners only.
export const createInvitationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/invitations',
  body: createInvitationBodySchema,
  response: invitationSchema,
});
