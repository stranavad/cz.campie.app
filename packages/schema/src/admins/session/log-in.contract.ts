import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

export const logInBodySchema = z.object({
  email: emailSchema,
  // Any password the admin may have set; the strength rules apply when it is set, not here.
  password: z.string().min(1).max(200),
});

export type LogInBody = z.infer<typeof logInBodySchema>;

// Codes of a refused login, which the app translates. Every wrong email or password gets the same one.
export const LOG_IN_ERROR_CODES = ['credentials_invalid', 'login_throttled'] as const;

export type LogInErrorCode = (typeof LOG_IN_ERROR_CODES)[number];

// Starts an admin session on the main host and sets its cookie.
export const logInEndpoint = defineEndpoint({
  method: 'POST',
  path: '/sessions',
  body: logInBodySchema,
});
