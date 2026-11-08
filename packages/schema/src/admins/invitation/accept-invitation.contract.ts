import { z } from 'zod';

import { defineEndpoint, passwordSchema } from '@repo/schema/shared';

import { invitationTokenSchema } from './look-up-invitation.contract.ts';

export const acceptInvitationBodySchema = z.object({
  token: invitationTokenSchema,
  // Required unless the address has an account whose email is verified; the account it sets is signed in.
  password: passwordSchema.optional(),
});

export type AcceptInvitationBody = z.infer<typeof acceptInvitationBodySchema>;

// Joins the invitation's Organisation with its levels, once. A new account is created and signed in, as is
// one whose email was never verified, which the invitee takes over; a verified one joins without a new
// password and signs in as usual.
export const acceptInvitationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/invitations/accept',
  body: acceptInvitationBodySchema,
});
