import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const startGuardianSessionBodySchema = z.object({
  // From the emailed link.
  token: z.string().min(1).max(100),
});

export type StartGuardianSessionBody = z.infer<typeof startGuardianSessionBodySchema>;

// Code of a link that is unknown, used or expired, which the portal translates.
export const GUARDIAN_LOGIN_ERROR_CODES = ['login_link_invalid'] as const;

export type GuardianLoginErrorCode = (typeof GUARDIAN_LOGIN_ERROR_CODES)[number];

// Uses an emailed link, once, and sets the guardian session cookie on the subdomain.
export const startGuardianSessionEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/session',
  body: startGuardianSessionBodySchema,
});
