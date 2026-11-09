import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { totpCodeSchema, totpEnrolmentSchema } from './totp.resource.ts';

// A current code from the app in use now, never a recovery code.
export const startTotpReplacementBodySchema = z.object({ code: totpCodeSchema });

export type StartTotpReplacementBody = z.infer<typeof startTotpReplacementBodySchema>;

// Moves two-step login to a new phone while it stays on: gives a new secret, replacing one given earlier and
// not confirmed. The old app keeps working until the new secret is confirmed. Needs a session that passed
// the second step.
export const startTotpReplacementEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/totp/replacement',
  body: startTotpReplacementBodySchema,
  response: totpEnrolmentSchema,
  status: 200,
});
