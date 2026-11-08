import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Generates one Participant's Přihláška again, as an admin asked.
export const regeneratePrihlaskaJob = defineJob({
  name: 'registrations.regenerate-prihlaska',
  scope: 'organisation',
  payload: z.object({ participantId: z.uuid() }),
  alertWhenFailed: true,
});
