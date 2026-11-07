import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const comgateNotificationParamsSchema = z.object({ organisationId: z.uuid() });

// Comgate posts the whole payment, but nothing in it is trusted: only the transaction id is read, and
// its status is fetched from Comgate with the Organisation's keys.
export const comgateNotificationBodySchema = z.object({
  transId: z.string().regex(/^[A-Za-z0-9-]{1,64}$/),
});

export type ComgateNotificationBody = z.infer<typeof comgateNotificationBodySchema>;

// Comgate's notification of a payment's change, at each Organisation's own address. Answers 200 once
// handled, so Comgate stops repeating it; a failure to reach Comgate answers 500, and Comgate repeats.
export const comgateNotificationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/webhooks/comgate/:organisationId',
  params: comgateNotificationParamsSchema,
  body: comgateNotificationBodySchema,
  status: 200,
});
