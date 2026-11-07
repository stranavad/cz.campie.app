import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { totpCodeSchema } from './totp.resource.ts';

export const confirmTotpEnrolmentBodySchema = z.object({ code: totpCodeSchema });

export type ConfirmTotpEnrolmentBody = z.infer<typeof confirmTotpEnrolmentBodySchema>;

// The recovery codes, shown once: only their hashes are kept.
export const totpEnabledSchema = z.object({ recoveryCodes: z.array(z.string()) });

export type TotpEnabled = z.infer<typeof totpEnabledSchema>;

// Turns TOTP on with a code from the new secret, gives the recovery codes, and replaces the session cookie
// with one of a session that passed it.
export const confirmTotpEnrolmentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/totp/confirm',
  body: confirmTotpEnrolmentBodySchema,
  response: totpEnabledSchema,
  status: 200,
});
