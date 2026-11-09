import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const confirmEmailChangeBodySchema = z.object({
  // From the emailed link.
  token: z.string().min(1).max(100),
});

export type ConfirmEmailChangeBody = z.infer<typeof confirmEmailChangeBodySchema>;

// Codes of a refused confirmation, which the app translates: the link is unknown, used or expired, or
// another admin has the address by now.
export const EMAIL_CHANGE_ERROR_CODES = ['email_change_invalid', 'email_taken'] as const;

export type EmailChangeErrorCode = (typeof EMAIL_CHANGE_ERROR_CODES)[number];

// Changes an admin's email through the link mailed to the new address, once, which also verifies it; the
// old address is told. The link is the permission, so no session is needed.
export const confirmEmailChangeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/email-changes/confirm',
  body: confirmEmailChangeBodySchema,
});
