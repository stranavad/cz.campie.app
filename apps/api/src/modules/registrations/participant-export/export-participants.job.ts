import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Builds an export's spreadsheet and stores it.
export const exportParticipantsJob = defineJob({
  name: 'registrations.export-participants',
  scope: 'organisation',
  payload: z.object({ exportId: z.uuid() }),
});
