import { z } from 'zod';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { PARTICIPANT_STATUSES } from '../registration/participant-status.ts';

// The Turnus an admin looks at, remembered per admin and Organisation, and the Turnusy to switch between.
// A viewing choice, not a business state.
export const selectedTurnusSchema = z.object({
  turnusId: z.uuid().nullable(),
  turnusy: z.array(z.object({ id: z.uuid(), campName: z.string(), name: z.string(), startDate: calendarDateSchema })),
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

export const participantListQuerySchema = z.object({
  // Child or guardian name, email or Variable symbol, in any case and with or without diacritics.
  search: z.string().trim().max(100).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  unverifiedClaimedDiscount: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ParticipantListQuery = z.output<typeof participantListQuerySchema>;

export const participantRowSchema = z.object({
  participantId: z.uuid(),
  registrationId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  ageOnStart: z.number().int(),
  guardianName: z.string(),
  guardianEmail: z.string(),
  variableSymbol: z.string(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  amountDue: z.object({ amount: z.number().int(), dueDate: calendarDateSchema.nullable() }),
  overdue: z.boolean(),
  status: z.enum(PARTICIPANT_STATUSES),
  // A Claimed discount that needs the camp's verification was answered for this child.
  unverifiedClaimedDiscount: z.boolean(),
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
