import { z } from 'zod';

import { permissionsSchema } from '../membership/membership.resource.ts';

// An invitation to the current Organisation not yet accepted: the address it went to and the levels the
// invitee gets on joining.
export const invitationSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  permissions: permissionsSchema,
  expiresAt: z.iso.datetime(),
});

export type Invitation = z.infer<typeof invitationSchema>;

// Codes of a refused invitation or acceptance, which the app translates: a link that is unknown, used or
// expired; an address that is already a member; a new account without a password.
export const INVITATION_ERROR_CODES = ['invitation_invalid', 'already_member', 'password_required'] as const;

export type InvitationErrorCode = (typeof INVITATION_ERROR_CODES)[number];
