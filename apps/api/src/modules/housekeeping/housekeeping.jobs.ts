import { z } from 'zod';

import { defineJob, defineRecurringJob } from '../../core/jobs/job.ts';

// Every hour: removes the platform's expired login data, then has each Organisation tidy its own.
export const housekeepingJob = defineRecurringJob({ name: 'housekeeping.platform', everyMs: 60 * 60 * 1000 });

// One Organisation's share, in its own unit of work: expired exports and login data.
export const organisationHousekeepingJob = defineJob({
  name: 'housekeeping.organisation',
  scope: 'organisation',
  payload: z.object({}),
});
