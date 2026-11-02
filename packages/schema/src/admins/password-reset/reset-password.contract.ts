import { z } from 'zod';

import { defineEndpoint, passwordSchema } from '@repo/schema/shared';

export const resetPasswordBodySchema = z.object({
  // From the emailed link.
  token: z.string().min(1).max(100),
  password: passwordSchema,
});

export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

// Code of a link that is unknown, used or expired, which the app translates; a weak password gets one of
// the password codes.
export const PASSWORD_RESET_ERROR_CODES = ['password_reset_invalid'] as const;

export type PasswordResetErrorCode = (typeof PASSWORD_RESET_ERROR_CODES)[number];

// Sets a new password through an emailed link, once, and ends the admin's sessions.
export const resetPasswordEndpoint = defineEndpoint({
  method: 'POST',
  path: '/password-resets/complete',
  body: resetPasswordBodySchema,
});
