import { z } from 'zod';

import { priceLineSchema } from '@repo/schema/camps';
import { fileLinkSchema } from '@repo/schema/files';
import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import {
  invoiceFileSchema,
  invoiceRequestSchema,
  PARTICIPANT_STATUSES,
  registrationPaymentSchema,
} from '@repo/schema/registrations';
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
    // The modules guardians use in the portal, while the Camp has them on.
    consents: z.boolean(),
    documents: z.boolean(),
    // Whether the guardian may add an Invoice request.
    invoiceRequests: z.boolean(),
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
  // Guardians' addresses the mail provider reported undeliverable, for the guardian to correct.
  undeliverableEmails: z.array(z.string()),
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
  payment: registrationPaymentSchema,
  invoiceRequest: invoiceRequestSchema.nullable(),
  // The invoices the camp uploaded, oldest first, to pass on to the company.
  invoiceFiles: z.array(invoiceFileSchema),
});

export type GuardianRegistration = z.infer<typeof guardianRegistrationSchema>;

export const guardianRegistrationParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianRegistrationParams = z.infer<typeof guardianRegistrationParamsSchema>;

// The portal's home: the guardian's Registrations and whom to write about a technical problem.
export const guardianPortalSchema = z.object({
  registrations: z.array(guardianRegistrationSchema),
  // The signed-in email's name as a guardian on its newest Registration; null for an access email only.
  guardian: z.object({ firstName: z.string(), lastName: z.string() }).nullable(),
  technicalContact: z.string(),
});

export type GuardianPortal = z.infer<typeof guardianPortalSchema>;
