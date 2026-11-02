import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// A platform job: an admin identity belongs to no Organisation.
export const passwordResetRequestedJob = defineJob({
  name: 'admins.password-reset-requested',
  scope: 'platform',
  payload: z.object({ adminId: z.uuid() }),
});
