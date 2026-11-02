import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const removeMemberParamsSchema = z.object({ memberId: z.uuid() });

export type RemoveMemberParams = z.infer<typeof removeMemberParamsSchema>;

// Ends a member's access to the current Organisation from their next request; Owners only.
export const removeMemberEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/members/:memberId',
  params: removeMemberParamsSchema,
});
