import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Renders and stores the signed PDF of a signature, then has it emailed.
export const generateSignedConsentJob = defineJob({
  name: 'consents.generate-signed-consent',
  scope: 'organisation',
  payload: z.object({ signatureId: z.uuid() }),
});

// Emails the signed PDF to one guardian of the Participant's Registration.
export const sendConsentCopyJob = defineJob({
  name: 'consents.send-consent-copy',
  scope: 'organisation',
  payload: z.object({ signatureId: z.uuid(), guardian: z.number().int().min(1).max(2) }),
});
