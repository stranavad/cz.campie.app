import { z } from 'zod';

import { permissionsSchema } from '../membership/membership.resource.ts';

// An admin's membership in the current Organisation, with the email that names them.
export const memberSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  owner: z.boolean(),
  permissions: permissionsSchema,
});

export type Member = z.infer<typeof memberSchema>;

// Code of a change that would leave the Organisation without an Owner, which the app translates.
export const MEMBER_ERROR_CODES = ['last_owner'] as const;

export type MemberErrorCode = (typeof MEMBER_ERROR_CODES)[number];
