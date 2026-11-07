import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { secondStepCodeSchema } from './totp.resource.ts';

export const verifyTotpBodySchema = z.object({ code: secondStepCodeSchema });

export type VerifyTotpBody = z.infer<typeof verifyTotpBodySchema>;

// The second step of a login: a code from the admin's authenticator app, or one of their recovery codes,
// each of which works once. The session cookie is replaced
// with one of a session that passed it; the old one no longer opens anything.
export const verifyTotpEndpoint = defineEndpoint({
  method: 'POST',
  path: '/sessions/current/totp',
  body: verifyTotpBodySchema,
});
