import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const revokeInvitationParamsSchema = z.object({ invitationId: z.uuid() });

export type RevokeInvitationParams = z.infer<typeof revokeInvitationParamsSchema>;

// Makes an invitation's link stop working; Owners only.
export const revokeInvitationEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/invitations/:invitationId',
  params: revokeInvitationParamsSchema,
});
