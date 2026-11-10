import { z } from 'zod';

import { AMOUNT_DUE_PHASES } from '@repo/schema/pricing';
import { calendarDateSchema } from '@repo/schema/shared';

const amount = z.number().int();

// How to pay the guardian's share of a Registration, as the portal, the submitted page and a card payment that did not go through
// show it: the amount due now and, while Deposits are owed, everything at once; each with its QR platba
// payload, null without the Organisation's account or anything to pay.
export const registrationPaymentSchema = z.object({
  account: z.string().nullable(),
  // Whether the Organisation takes card payments.
  card: z.boolean(),
  phase: z.enum(AMOUNT_DUE_PHASES),
  amount,
  dueDate: calendarDateSchema.nullable(),
  qrPlatba: z.string().nullable(),
  balance: z
    .object({ amount, dueDate: calendarDateSchema.nullable(), outstanding: amount, qrPlatba: z.string().nullable() })
    .nullable(),
  // What an Invoice request leaves to the company, shown beside the guardian's share; null without one.
  invoiced: z.object({ companyName: z.string(), amount }).nullable(),
});

export type RegistrationPayment = z.infer<typeof registrationPaymentSchema>;
