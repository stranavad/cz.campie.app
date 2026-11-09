import { z } from 'zod';

import { EMAIL_TYPES } from '@repo/schema/emails';

import { defineJob } from '../../../core/jobs/job.ts';

// Sends an admin a draft of a Camp's email at their own address. The admin travels by id and the draft
// sealed with the Organisation's key, base64: an admin may type anything into it, and Redis is outside
// the encryption and erasure.
export const sendTestCampEmailJob = defineJob({
  name: 'camps.send-test-email',
  scope: 'organisation',
  payload: z.object({ campId: z.uuid(), type: z.enum(EMAIL_TYPES), adminId: z.uuid(), sealedDraft: z.base64() }),
});
