import { z } from 'zod';

import { priceLineSchema } from '@repo/schema/camps';
import { fileLinkSchema } from '@repo/schema/files';
import { AMOUNT_DUE_PHASES, PAYMENT_STATUSES } from '@repo/schema/pricing';
import { PARTICIPANT_STATUSES } from '@repo/schema/registrations';
import { calendarDateSchema } from '@repo/schema/shared';

const amount = z.number().int();

// A Registration as its guardian sees it in the portal: whom it places where, what it costs, what was
// paid, and how to pay the rest. Never health data.
export const guardianRegistrationSchema = z.object({
  id: z.uuid(),
  variableSymbol: z.string(),
  submittedAt: z.iso.datetime(),
  camp: z.object({
    id: z.uuid(),
    name: z.string(),
    // The Camp's contact, else its Organisation's.
    contactEmail: z.string(),
    contactPhone: z.string().nullable(),
  }),
  turnus: z.object({
    id: z.uuid(),
    name: z.string(),
    startDate: calendarDateSchema,
    endDate: calendarDateSchema,
    place: z.string(),
  }),
  participants: z.array(
    z.object({
      id: z.uuid(),
      // As the price lines name it.
      position: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      status: z.enum(PARTICIPANT_STATUSES),
      // A download link for a few minutes; null until the Přihláška is generated.
      prihlaska: fileLinkSchema.nullable(),
    }),
  ),
  // A Participant's line names its position among the Participants.
  priceLines: z.array(priceLineSchema),
  // Amounts only: an admin's note is the camp's own record and may name private reasons.
  adjustments: z.array(z.object({ amount })),
  payments: z.array(z.object({ amount, paidOn: calendarDateSchema })),
  total: amount,
  paid: amount,
  balance: amount,
  status: z.enum(PAYMENT_STATUSES),
  overdue: z.boolean(),
  // How to pay: the amount due now and, while Deposits are owed, everything at once; each with its QR
  // platba payload, null without the Organisation's account or anything to pay.
  payment: z.object({
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
  }),
});

export type GuardianRegistration = z.infer<typeof guardianRegistrationSchema>;

export const guardianRegistrationParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianRegistrationParams = z.infer<typeof guardianRegistrationParamsSchema>;

// The portal's home: the guardian's Registrations and whom to write about a technical problem.
export const guardianPortalSchema = z.object({
  registrations: z.array(guardianRegistrationSchema),
  technicalContact: z.string(),
});

export type GuardianPortal = z.infer<typeof guardianPortalSchema>;
