import { z } from 'zod';

import { ORGANISATION_STATUSES } from '@repo/schema/organisations';

// The signed-in admin's own identity and the Organisations they are a member of.
export const accountSchema = z.object({
  email: z.string(),
  memberships: z.array(
    z.object({
      owner: z.boolean(),
      organisation: z.object({
        id: z.uuid(),
        displayName: z.string(),
        subdomain: z.string(),
        status: z.enum(ORGANISATION_STATUSES),
      }),
    }),
  ),
});

export type Account = z.infer<typeof accountSchema>;
