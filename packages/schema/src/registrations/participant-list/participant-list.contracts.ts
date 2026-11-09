import { z } from 'zod';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { PARTICIPANT_STATUSES } from '../registration/participant-status.ts';

// The Turnus an admin looks at, remembered per admin and Organisation, and the Turnusy to switch between.
// A viewing choice, not a business state.
export const selectedTurnusSchema = z.object({
  turnusId: z.uuid().nullable(),
  turnusy: z.array(
    z.object({ id: z.uuid(), campId: z.uuid(), campName: z.string(), name: z.string(), startDate: calendarDateSchema }),
  ),
});

export type SelectedTurnus = z.infer<typeof selectedTurnusSchema>;

// The admin's Selected Turnus and the Organisation's Turnusy, newest start first; Registrations read.
export const getSelectedTurnusEndpoint = defineEndpoint({
  method: 'GET',
  path: '/selected-turnus',
  response: selectedTurnusSchema,
});

export const setSelectedTurnusBodySchema = z.object({ turnusId: z.uuid() });

export type SetSelectedTurnusBody = z.infer<typeof setSelectedTurnusBodySchema>;

// Remembers the admin's Selected Turnus in this Organisation; Registrations read.
export const setSelectedTurnusEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/selected-turnus',
  body: setSelectedTurnusBodySchema,
  response: selectedTurnusSchema,
});

export const participantListParamsSchema = z.object({ turnusId: z.uuid() });

export type ParticipantListParams = z.infer<typeof participantListParamsSchema>;

const flag = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

export const participantListQuerySchema = z.object({
  // Child or guardian name, email or Variable symbol, in any case and with or without diacritics.
  search: z.string().trim().max(100).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  overdue: flag,
  unverifiedClaimedDiscount: flag,
  // From the child's checklist: a Consent not signed, a requirement nothing or a returned document was
  // handed in for, answers owed to fields added later.
  unsignedConsent: flag,
  missingDocument: flag,
  missingAnswers: flag,
});

export type ParticipantListQuery = z.output<typeof participantListQuerySchema>;

// A child's documents at a glance: every requirement approved or done (`complete`), one waiting for review
// (`to_review`), or one with nothing handed in or only a returned document (`missing`), which outweighs a
// review.
export const DOCUMENTS_STATUSES = ['complete', 'to_review', 'missing'] as const;

export type DocumentsStatus = (typeof DOCUMENTS_STATUSES)[number];

export const participantRowSchema = z.object({
  participantId: z.uuid(),
  registrationId: z.uuid(),
  // When the Registration was submitted.
  submittedAt: z.iso.datetime(),
  firstName: z.string(),
  lastName: z.string(),
  ageOnStart: z.number().int(),
  guardianName: z.string(),
  guardianEmail: z.string(),
  // The mail provider reported an address of a guardian of the Registration undeliverable.
  emailUndeliverable: z.boolean(),
  variableSymbol: z.string(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  amountDue: z.object({ amount: z.number().int(), dueDate: calendarDateSchema.nullable() }),
  overdue: z.boolean(),
  status: z.enum(PARTICIPANT_STATUSES),
  // A Claimed discount that needs the camp's verification was answered for this child.
  unverifiedClaimedDiscount: z.boolean(),
  // The Camp's Consents the child has answered, against all of them; a Withdrawn one is the guardians'
  // answer, so it counts as signed, as on the checklist. Null while the Camp has Consents off, and for a
  // Cancelled child, who has no checklist.
  consents: z.object({ signed: z.number().int(), required: z.number().int() }).nullable(),
  // Null while the Camp has documents off, and for a Cancelled child.
  documents: z.enum(DOCUMENTS_STATUSES).nullable(),
  missingAnswers: z.boolean(),
});

export type ParticipantRow = z.infer<typeof participantRowSchema>;

// One row per Participant of a Turnus, by surname, filtered and searched; Registrations read. No health data.
export const listParticipantsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/participants',
  params: participantListParamsSchema,
  query: participantListQuerySchema,
  response: z.array(participantRowSchema),
});
