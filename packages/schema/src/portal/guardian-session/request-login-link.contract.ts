import { z } from 'zod';

import { defineEndpoint, emailSchema } from '@repo/schema/shared';

export const requestLoginLinkBodySchema = z.object({ email: emailSchema });

export type RequestLoginLinkBody = z.infer<typeof requestLoginLinkBodySchema>;

// Emails a guardian a link into the portal of the subdomain's Organisation when the address is a guardian
// of one of its Registrations, and answers the same either way. Rate limited per address and per email.
export const requestLoginLinkEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/login-links',
  body: requestLoginLinkBodySchema,
});
