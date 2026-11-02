import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

export const OWNER_CHANGES = ['promoted', 'demoted', 'removed'] as const;

export type OwnerChange = (typeof OWNER_CHANGES)[number];

// Tells one Owner that another admin became or stopped being an Owner of the job's Organisation.
export const ownerChangedJob = defineJob({
  name: 'admins.owner-changed',
  scope: 'organisation',
  payload: z.object({
    recipientId: z.uuid(),
    adminId: z.uuid(),
    change: z.enum(OWNER_CHANGES),
    // The admin who made the change; null when the platform made it.
    changedById: z.uuid().nullable(),
  }),
});
