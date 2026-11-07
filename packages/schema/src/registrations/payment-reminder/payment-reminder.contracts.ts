import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { participantListParamsSchema } from '../participant-list/participant-list.contracts.ts';

// How many Registrations of a Turnus a payment reminder would go to, before the admin confirms.
export const paymentReminderPreviewSchema = z.object({
  // Registrations with a Registered child and anything left to pay.
  withBalance: z.number().int(),
  overdue: z.number().int(),
  // Whether the Camp sends its payment reminder at all.
  enabled: z.boolean(),
});

export type PaymentReminderPreview = z.infer<typeof paymentReminderPreviewSchema>;

// Registrations write.
export const previewPaymentRemindersEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/payment-reminders',
  params: participantListParamsSchema,
  response: paymentReminderPreviewSchema,
});

export const sendPaymentRemindersBodySchema = z.object({ overdueOnly: z.boolean() });

export type SendPaymentRemindersBody = z.infer<typeof sendPaymentRemindersBodySchema>;

export const paymentRemindersSentSchema = z.object({ reminded: z.number().int() });

export type PaymentRemindersSent = z.infer<typeof paymentRemindersSentSchema>;

// `payment_reminder_switched_off`: the Camp switched its payment reminder off, so nothing was sent.
export const PAYMENT_REMINDER_ERROR_CODES = ['payment_reminder_switched_off'] as const;

export type PaymentReminderErrorCode = (typeof PAYMENT_REMINDER_ERROR_CODES)[number];

// Reminds the guardians of every Registration of the Turnus with a balance, or only the Overdue ones,
// from jobs, audited with how many; limited per Organisation. Registrations write.
export const sendPaymentRemindersEndpoint = defineEndpoint({
  method: 'POST',
  path: '/turnusy/:turnusId/payment-reminders',
  params: participantListParamsSchema,
  body: sendPaymentRemindersBodySchema,
  response: paymentRemindersSentSchema,
});
