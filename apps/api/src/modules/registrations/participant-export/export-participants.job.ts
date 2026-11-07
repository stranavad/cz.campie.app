import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Builds an export's spreadsheet and stores it.
export const exportParticipantsJob = defineJob({
  name: 'registrations.export-participants',
  scope: 'organisation',
  payload: z.object({ exportId: z.uuid() }),
});

// Removes an export and its file once its admin had time to download it.
export const removeExportJob = defineJob({
  name: 'registrations.remove-export',
  scope: 'organisation',
  payload: z.object({ exportId: z.uuid() }),
});
