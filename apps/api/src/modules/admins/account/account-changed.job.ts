import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// What changed in an admin's account that they are told of at their own address.
export const ACCOUNT_CHANGES = ['password', 'totp'] as const;

// Tells an admin of a change to how they sign in. A platform job: an admin identity belongs to no
// Organisation.
export const accountChangedJob = defineJob({
  name: 'admins.account-changed',
  scope: 'platform',
  payload: z.object({ adminId: z.uuid(), change: z.enum(ACCOUNT_CHANGES) }),
});
