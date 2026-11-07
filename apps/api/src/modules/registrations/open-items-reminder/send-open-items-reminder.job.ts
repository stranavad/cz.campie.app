import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Reminds one guardian of a Registration of what is still open for each child.
export const sendOpenItemsReminderJob = defineJob({
  name: 'checklist.send-open-items-reminder',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
