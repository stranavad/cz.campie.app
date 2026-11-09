import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { totpCodeSchema } from './totp.resource.ts';

// A code from the new app.
export const confirmTotpReplacementBodySchema = z.object({ code: totpCodeSchema });

export type ConfirmTotpReplacementBody = z.infer<typeof confirmTotpReplacementBodySchema>;

// Replaces the secret by the new one in one step; from then only the new app's codes work. The recovery
// codes stay. Audited in the platform's log as the fact only, and emailed to the admin.
export const confirmTotpReplacementEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/totp/replacement/confirm',
  body: confirmTotpReplacementBodySchema,
});
