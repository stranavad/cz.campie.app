import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// A platform job: the Organisation is pending and its mail goes to the Platform operator, not from it.
export const organisationSignedUpJob = defineJob({
  name: 'organisations.signed-up',
  scope: 'platform',
  payload: z.object({ organisationId: z.uuid() }),
});
