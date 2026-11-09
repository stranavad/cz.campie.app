import { z } from 'zod';

import { personSchema } from '@repo/schema/shared';

import { permissionsSchema } from '../membership/membership.resource.ts';

// An invitation to the current Organisation not yet accepted: the address it went to, the levels the
// invitee gets on joining, and who last sent its link and when.
export const invitationSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  permissions: permissionsSchema,
  sentAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  // Null for an invitation from before this was recorded, or an Owner whose account is gone.
  invitedBy: personSchema.nullable(),
});

export type Invitation = z.infer<typeof invitationSchema>;

// Codes of a refused invitation or acceptance, which the app translates: a link that is unknown, used or
// expired; an address that is already a member; a new account without a password, or without a name.
export const INVITATION_ERROR_CODES = [
  'invitation_invalid',
  'already_member',
  'password_required',
  'name_required',
] as const;

export type InvitationErrorCode = (typeof INVITATION_ERROR_CODES)[number];
