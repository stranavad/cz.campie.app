import { z } from 'zod';

import { defineJob } from './job.ts';

// Tells the Platform operator that a job asking for it failed for good: which job, and in which
// Organisation, by ids only.
export const jobFailedJob = defineJob({
  name: 'jobs.failed',
  scope: 'platform',
  payload: z.object({ job: z.string(), jobId: z.string().nullable(), organisationId: z.uuid().nullable() }),
});
