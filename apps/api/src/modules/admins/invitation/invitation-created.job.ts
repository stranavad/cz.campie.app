import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Emails an invitation's link, made by the job so the token never sits in Redis.
export const invitationCreatedJob = defineJob({
  name: 'admins.invitation-created',
  scope: 'organisation',
  payload: z.object({ invitationId: z.uuid() }),
});
