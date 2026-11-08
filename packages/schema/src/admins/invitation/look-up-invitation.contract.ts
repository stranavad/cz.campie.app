import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const invitationTokenSchema = z.string().min(1).max(100);

export const lookUpInvitationBodySchema = z.object({
  // From the emailed link.
  token: invitationTokenSchema,
});

export type LookUpInvitationBody = z.infer<typeof lookUpInvitationBodySchema>;

// What the invitee sees before accepting. With an account whose email is verified they join as they are;
// otherwise they choose a password.
export const invitationPreviewSchema = z.object({
  email: z.string(),
  organisation: z.object({ displayName: z.string() }),
  hasAccount: z.boolean(),
});

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;

// Reads an invitation by its link's token, for the page the link opens; a POST, so the token stays out
// of URLs and logs.
export const lookUpInvitationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/invitations/lookup',
  body: lookUpInvitationBodySchema,
  response: invitationPreviewSchema,
});
