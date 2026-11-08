import { z } from 'zod';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { defineEndpoint } from '@repo/schema/shared';

import { participantListParamsSchema } from '../participant-list/participant-list.contracts.ts';

// A Turnus at a glance: places taken against capacity, and its money across every Registration.
export const turnusOverviewSchema = z.object({
  capacity: z.number().int(),
  // Registered children; Cancelled ones free their places.
  registered: z.number().int(),
  // Whole CZK, summed over the Turnus's Registrations: their totals, what was paid, what is still owed,
  // and what was paid beyond the total.
  expected: z.number().int(),
  received: z.number().int(),
  outstanding: z.number().int(),
  overpaid: z.number().int(),
  overdueRegistrations: z.number().int(),
  // How many Registrations have each payment status, partly paid apart from unpaid.
  registrationsByPaymentStatus: z.record(z.enum(PAYMENT_STATUSES), z.number().int()),
});

export type TurnusOverview = z.infer<typeof turnusOverviewSchema>;

// Registrations read.
export const getTurnusOverviewEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/overview',
  params: participantListParamsSchema,
  response: turnusOverviewSchema,
});
