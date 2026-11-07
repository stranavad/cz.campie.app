import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells an admin their two-step login was turned off in the job's Organisation, by an Owner or the operator.
export const totpResetJob = defineJob({
  name: 'admins.totp-reset',
  scope: 'organisation',
  payload: z.object({ adminId: z.uuid(), byOperator: z.boolean() }),
});
