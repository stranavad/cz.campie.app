import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells one guardian which children's places were cancelled.
export const sendCancellationJob = defineJob({
  name: 'registrations.send-cancellation',
  scope: 'organisation',
  payload: z.object({
    registrationId: z.uuid(),
    guardian: z.number().int().min(1).max(2),
    participantIds: z.array(z.uuid()).min(1).max(100),
  }),
});
