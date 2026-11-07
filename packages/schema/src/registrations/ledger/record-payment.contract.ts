import { z } from 'zod';

import { calendarDateSchema, czkSchema, defineEndpoint } from '@repo/schema/shared';

import { ledgerSchema, registrationParamsSchema } from './ledger.resource.ts';

export const recordPaymentBodySchema = z
  .object({
    // A payment received, or a Correcting payment taking the amount back.
    kind: z.enum(['payment', 'correction']),
    // Whole CZK, always positive; a correction is recorded as its negative.
    amount: czkSchema.min(1),
    paidOn: calendarDateSchema,
    note: z.string().trim().max(500),
  })
  // A Correcting payment's note is the only record of why money went back.
  .refine(({ kind, note }) => kind === 'payment' || note !== '', {
    path: ['note'],
    message: 'correction_note_required',
  });

export type RecordPaymentBody = z.infer<typeof recordPaymentBodySchema>;

// Why an entry was refused: a Correcting payment may take back at most what was paid.
export const RECORD_PAYMENT_ERROR_CODES = ['correction_exceeds_paid'] as const;

export type RecordPaymentErrorCode = (typeof RECORD_PAYMENT_ERROR_CODES)[number];

// Adds an entry to a Registration's ledger, which is never changed or removed afterwards; audited. A
// payment received emails both guardians. Registrations write.
export const recordPaymentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/payments',
  params: registrationParamsSchema,
  body: recordPaymentBodySchema,
  response: ledgerSchema,
});
