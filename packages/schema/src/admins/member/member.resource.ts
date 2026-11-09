import { z } from 'zod';

import { personSchema } from '@repo/schema/shared';

import { permissionsSchema } from '../membership/membership.resource.ts';

// An admin's membership in the current Organisation, with their email and, once they gave it, their name.
export const memberSchema = z.object({
  id: z.uuid(),
  ...personSchema.shape,
  owner: z.boolean(),
  permissions: permissionsSchema,
  // Whether the admin logs in with a TOTP code.
  totpEnabled: z.boolean(),
});

export type Member = z.infer<typeof memberSchema>;

// Code of a change that would leave the Organisation without an Owner, which the app translates.
export const MEMBER_ERROR_CODES = ['last_owner'] as const;

export type MemberErrorCode = (typeof MEMBER_ERROR_CODES)[number];
