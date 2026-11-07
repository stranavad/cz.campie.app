import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// A platform job: tells the Platform operator of a new report.
export const problemReportedJob = defineJob({
  name: 'console.problem-reported',
  scope: 'platform',
  payload: z.object({ reportId: z.uuid() }),
});
