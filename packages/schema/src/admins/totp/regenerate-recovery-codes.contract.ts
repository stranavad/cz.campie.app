import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { totpEnabledSchema } from './confirm-totp-enrolment.contract.ts';
import { totpCodeSchema } from './totp.resource.ts';

// Six digits from the app only: a recovery code never makes new ones.
export const regenerateRecoveryCodesBodySchema = z.object({ code: totpCodeSchema });

export type RegenerateRecoveryCodesBody = z.infer<typeof regenerateRecoveryCodesBodySchema>;

// Replaces the signed-in admin's recovery codes with ten new ones, shown once; the old ones stop working.
// Needs a session that passed the second step and a current code from the app. Audited; the admin is
// emailed.
export const regenerateRecoveryCodesEndpoint = defineEndpoint({
  method: 'POST',
  path: '/account/totp/recovery-codes',
  body: regenerateRecoveryCodesBodySchema,
  response: totpEnabledSchema,
  status: 200,
});
