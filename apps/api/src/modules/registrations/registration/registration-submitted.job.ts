import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// What follows a submission, outside its request.
export const registrationSubmittedJob = defineJob({
  name: 'registrations.registration-submitted',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid() }),
});
