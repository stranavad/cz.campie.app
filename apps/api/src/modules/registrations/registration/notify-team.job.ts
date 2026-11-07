import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells the Camp's team of a new Registration.
export const notifyTeamJob = defineJob({
  name: 'registrations.notify-team',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid() }),
});
