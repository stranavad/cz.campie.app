import { z } from 'zod';

import { ORGANISATION_STATUSES } from '@repo/schema/organisations';
import { personSchema } from '@repo/schema/shared';

import { permissionsSchema } from '../membership/membership.resource.ts';

// The signed-in admin's own identity, their second factor and the Organisations they are a member of.
export const accountSchema = z.object({
  // The name is null until the admin gives it; the admin interface names them by email meanwhile.
  ...personSchema.shape,
  // Whether the admin proved the email theirs; until then the admin interface asks them to.
  emailVerified: z.boolean(),
  // Whether the admin is the Platform operator, whose console needs TOTP.
  operator: z.boolean(),
  // Null while two-step login is off: when it was turned on, and how many of the recovery codes issued are
  // still unused.
  totp: z
    .object({
      enabledAt: z.iso.datetime(),
      recoveryCodesLeft: z.number().int(),
      recoveryCodesIssued: z.number().int(),
    })
    .nullable(),
  // Whether this session passed a TOTP code.
  secondFactor: z.boolean(),
  memberships: z.array(
    z.object({
      owner: z.boolean(),
      // What the member may do in each area; an Owner may do everything whatever these say.
      permissions: permissionsSchema,
      organisation: z.object({
        id: z.uuid(),
        displayName: z.string(),
        subdomain: z.string(),
        status: z.enum(ORGANISATION_STATUSES),
        // Whether its admins must log in with a TOTP code.
        totpRequired: z.boolean(),
        // Brands the admin interface while the admin works in it.
        accentColour: z.string(),
      }),
      // For the Platform operator only: an Organisation under its support grant, not a membership, and
      // whether this session entered it, which the access guard requires before anything else.
      support: z.object({ allowWrites: z.boolean(), expiresAt: z.iso.datetime(), entered: z.boolean() }).nullable(),
    }),
  ),
});

export type Account = z.infer<typeof accountSchema>;

// Codes of a refused change of the admin's own account, which the app translates: the current password is
// wrong, or the new email is the one they have.
export const ACCOUNT_ERROR_CODES = ['current_password_invalid', 'email_unchanged'] as const;

export type AccountErrorCode = (typeof ACCOUNT_ERROR_CODES)[number];
