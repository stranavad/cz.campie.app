import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { permissionsSchema } from '../membership/membership.resource.ts';
import { memberSchema } from './member.resource.ts';

export const updateMemberParamsSchema = z.object({ memberId: z.uuid() });

export type UpdateMemberParams = z.infer<typeof updateMemberParamsSchema>;

// What is left out stays as it is; something must change.
export const updateMemberBodySchema = z
  .object({
    // Promotes the member to Owner, or demotes them; every Owner is told. A demoted Owner keeps the levels
    // their membership held.
    owner: z.boolean().optional(),
    permissions: permissionsSchema.optional(),
  })
  .refine((body) => body.owner !== undefined || body.permissions !== undefined, 'member_change_empty');

export type UpdateMemberBody = z.infer<typeof updateMemberBodySchema>;

// Changes a member's levels or Owner role, effective from their next request; Owners only.
export const updateMemberEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/members/:memberId',
  params: updateMemberParamsSchema,
  body: updateMemberBodySchema,
  response: memberSchema,
});
