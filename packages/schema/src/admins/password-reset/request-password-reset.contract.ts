import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

export const requestPasswordResetBodySchema = z.object({ email: emailSchema });

export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetBodySchema>;

// Emails a reset link when the address has an admin account, and answers the same either way.
export const requestPasswordResetEndpoint = defineEndpoint({
  method: 'POST',
  path: '/password-resets',
  body: requestPasswordResetBodySchema,
});
