import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const verifyEmailBodySchema = z.object({
  // From the emailed link.
  token: z.string().min(1).max(100),
});

export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;

// Code of a link that is unknown, used or expired, which the app translates.
export const EMAIL_VERIFICATION_ERROR_CODES = ['email_verification_invalid'] as const;

export type EmailVerificationErrorCode = (typeof EMAIL_VERIFICATION_ERROR_CODES)[number];

// Verifies an admin's email through an emailed link, once, without a password: the link proves the email.
export const verifyEmailEndpoint = defineEndpoint({
  method: 'POST',
  path: '/email-verifications/complete',
  body: verifyEmailBodySchema,
});
