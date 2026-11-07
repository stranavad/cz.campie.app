import { z } from 'zod';

import { defineJob } from '../../../core/jobs/job.ts';

// Looks up a request for a portal login link and emails the link when the email is a guardian's. The
// request is named by its id, so no email sits in Redis, and the token is made in the job, so none does
// either.
export const loginLinkRequestedJob = defineJob({
  name: 'portal.login-link-requested',
  scope: 'organisation',
  payload: z.object({ requestId: z.uuid() }),
});
