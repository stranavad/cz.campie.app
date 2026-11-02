import { z } from 'zod';

import { defineEndpoint, passwordSchema } from '@repo/schema/shared';

import { invitationTokenSchema } from './look-up-invitation.contract.ts';

export const acceptInvitationBodySchema = z.object({
  token: invitationTokenSchema,
  // Required when the address has no account yet, which it then signs in to; ignored otherwise.
  password: passwordSchema.optional(),
});

export type AcceptInvitationBody = z.infer<typeof acceptInvitationBodySchema>;

// Joins the invitation's Organisation with its levels, once. A new account is created and signed in; an
// existing one joins without a new password and signs in as usual.
export const acceptInvitationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/invitations/accept',
  body: acceptInvitationBodySchema,
});
