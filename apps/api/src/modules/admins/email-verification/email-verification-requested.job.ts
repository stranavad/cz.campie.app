import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// An Organisation job: the verification is recorded in the Organisation the admin signed up.
export const emailVerificationRequestedJob = defineJob({
  name: 'admins.email-verification-requested',
  scope: 'organisation',
  payload: z.object({ adminId: z.uuid() }),
});
