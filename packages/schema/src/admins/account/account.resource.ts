import { z } from 'zod';

import { ORGANISATION_STATUSES } from '@repo/schema/organisations';

// The signed-in admin's own identity, their second factor and the Organisations they are a member of.
export const accountSchema = z.object({
  email: z.string(),
  // Whether the admin is the Platform operator, whose console needs TOTP.
  operator: z.boolean(),
  totpEnabled: z.boolean(),
  // Whether this session passed a TOTP code.
  secondFactor: z.boolean(),
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
