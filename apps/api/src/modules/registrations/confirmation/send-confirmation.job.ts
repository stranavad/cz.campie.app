import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Sends one guardian of a new Registration its confirmation, once the Přihlášky exist.
export const sendConfirmationJob = defineJob({
  name: 'registrations.send-confirmation',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
