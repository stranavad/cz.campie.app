import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Mails a waiting change's confirmation link to the new address. A platform job: an admin identity belongs
// to no Organisation.
export const adminEmailChangeRequestedJob = defineJob({
  name: 'admins.email-change-requested',
  scope: 'platform',
  payload: z.object({ changeId: z.uuid() }),
});

// Tells the old address of a confirmed change.
export const adminEmailChangeConfirmedJob = defineJob({
  name: 'admins.email-change-confirmed',
  scope: 'platform',
  payload: z.object({ changeId: z.uuid() }),
});
