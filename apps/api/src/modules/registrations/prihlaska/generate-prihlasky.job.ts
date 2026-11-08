import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Generates the Přihláška of every child of a new Registration, then confirms it to the guardians unless an
// admin who created it chose not to.
export const generatePrihlaskyJob = defineJob({
  name: 'registrations.generate-prihlasky',
  scope: 'organisation',
  payload: z.object({ registrationId: z.uuid(), sendConfirmation: z.boolean() }),
  alertWhenFailed: true,
});
