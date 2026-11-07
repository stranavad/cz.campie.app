import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Reminds one guardian of a Registration of what is due now.
export const sendPaymentReminderJob = defineJob({
  name: 'registrations.send-payment-reminder',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
