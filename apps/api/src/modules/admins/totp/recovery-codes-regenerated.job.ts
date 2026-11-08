import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Tells an admin new recovery codes replaced theirs. A platform job: an admin identity belongs to no
// Organisation.
export const recoveryCodesRegeneratedJob = defineJob({
  name: 'admins.recovery-codes-regenerated',
  scope: 'platform',
  payload: z.object({ adminId: z.uuid() }),
});
