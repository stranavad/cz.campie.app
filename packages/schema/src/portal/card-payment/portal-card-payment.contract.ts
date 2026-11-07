import { z } from 'zod';

import { cardPaymentRedirectSchema } from '@repo/schema/registrations';
import { defineEndpoint } from '@repo/schema/shared';

import { guardianRegistrationParamsSchema } from '../guardian-registration/guardian-registration.resource.ts';

// What a guardian pays by card: the amount due now, or everything still outstanding.
export const PORTAL_CARD_PAYMENT_AMOUNTS = ['due_now', 'balance'] as const;

export const startPortalCardPaymentBodySchema = z.object({ amount: z.enum(PORTAL_CARD_PAYMENT_AMOUNTS) });

export type StartPortalCardPaymentBody = z.infer<typeof startPortalCardPaymentBodySchema>;

// Starts a card payment of one of the guardian's Registrations; refusals carry a CardPaymentErrorCode.
export const startPortalCardPaymentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/card-payment',
  params: guardianRegistrationParamsSchema,
  body: startPortalCardPaymentBodySchema,
  response: cardPaymentRedirectSchema,
});
