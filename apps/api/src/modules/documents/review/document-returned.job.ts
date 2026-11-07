import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells one guardian a document came back to hand in again.
export const sendDocumentReturnedJob = defineJob({
  name: 'documents.send-document-returned',
  scope: 'organisation',
  payload: z.object({ uploadId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
