import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Emails a confirmation link to a guardian's new address; the token is made in the job.
export const emailChangeRequestedJob = defineJob({
  name: 'portal.email-change-requested',
  scope: 'organisation',
  payload: z.object({ changeId: z.uuid() }),
});

// Tells a guardian's previous address of a confirmed change.
export const emailChangeConfirmedJob = defineJob({
  name: 'portal.email-change-confirmed',
  scope: 'organisation',
  payload: z.object({ changeId: z.uuid() }),
});
