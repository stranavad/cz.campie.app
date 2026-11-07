import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells one guardian a payment was received.
export const sendPaymentReceivedJob = defineJob({
  name: 'registrations.send-payment-received',
  scope: 'organisation',
  payload: z.object({ paymentId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
