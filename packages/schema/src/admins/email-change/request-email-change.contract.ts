import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

export const requestEmailChangeBodySchema = z.object({
  email: emailSchema,
  // Checked like a login and counted against its limit, so a session left open does not hand the account over.
  currentPassword: z.string().min(1).max(200),
});

export type RequestEmailChangeBody = z.infer<typeof requestEmailChangeBodySchema>;

// Mails a confirmation link to the new address; the email changes only once it is followed. The answer is
// the same whether or not another admin has the address, so it tells nothing about who has an account. With
// two-step login on, only a session that passed it.
export const requestEmailChangeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/email-changes',
  body: requestEmailChangeBodySchema,
});
