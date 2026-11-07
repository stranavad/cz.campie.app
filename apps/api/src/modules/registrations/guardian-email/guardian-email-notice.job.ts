import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells a guardian's previous address of a confirmed change of their email, by a guardian or an admin.
export const emailChangeConfirmedJob = defineJob({
  name: 'registrations.email-change-confirmed',
  scope: 'organisation',
  payload: z.object({ changeId: z.uuid() }),
});
