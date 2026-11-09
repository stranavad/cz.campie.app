import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { registrationPaymentSchema } from '../registration-payment/registration-payment.resource.ts';

// Where the guardian is sent to pay by card, on Comgate's own pages.
export const cardPaymentRedirectSchema = z.object({ redirectUrl: z.url() });

export type CardPaymentRedirect = z.infer<typeof cardPaymentRedirectSchema>;

// `card_payment_unavailable`: the Organisation takes no card payments, or Comgate failed, so bank transfer
// stays the way to pay; `card_payment_nothing_due`: nothing is left to pay now.
export const CARD_PAYMENT_ERROR_CODES = ['card_payment_unavailable', 'card_payment_nothing_due'] as const;

export type CardPaymentErrorCode = (typeof CARD_PAYMENT_ERROR_CODES)[number];

export const startSubmittedCardPaymentBodySchema = z.object({
  // The submission's own key: only whoever submitted the Registration knows it.
  idempotencyKey: z.uuid(),
});

export type StartSubmittedCardPaymentBody = z.infer<typeof startSubmittedCardPaymentBodySchema>;

// Starts a card payment of the amount due now, straight after the submission, on the Organisation's
// subdomain. The submission never depends on it: a refusal leaves bank transfer.
export const startSubmittedCardPaymentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/card-payments',
  body: startSubmittedCardPaymentBodySchema,
  response: cardPaymentRedirectSchema,
});

export const CARD_PAYMENT_STATES = ['paid', 'pending', 'failed'] as const;

export type CardPaymentState = (typeof CARD_PAYMENT_STATES)[number];

export const cardPaymentResultParamsSchema = z.object({ transactionId: z.string().regex(/^[A-Za-z0-9-]{1,64}$/) });

export type CardPaymentResultParams = z.infer<typeof cardPaymentResultParamsSchema>;

// How a card payment ended, for the page Comgate sends the guardian back to, in the Camp's branding: what
// the payment was for and, while it has not gone through, how to pay by transfer instead. All of it comes
// from the payment the transaction id names; the Participants by first name only.
export const cardPaymentResultSchema = z.object({
  state: z.enum(CARD_PAYMENT_STATES),
  // What the card payment was started for.
  amount: z.number().int(),
  registrationId: z.uuid(),
  variableSymbol: z.string(),
  firstNames: z.array(z.string()),
  // Null once paid.
  payment: registrationPaymentSchema.nullable(),
  campName: z.string(),
  accentColour: z.string(),
  logoUrl: z.string().nullable(),
  // The Turnus's website, else the Camp's.
  websiteUrl: z.string().nullable(),
});

export type CardPaymentResult = z.infer<typeof cardPaymentResultSchema>;

export const getCardPaymentResultEndpoint = defineEndpoint({
  method: 'GET',
  path: '/card-payments/:transactionId',
  params: cardPaymentResultParamsSchema,
  response: cardPaymentResultSchema,
});
