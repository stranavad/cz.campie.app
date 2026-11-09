import { z } from 'zod';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { defineEndpoint } from '@repo/schema/shared';

import { REGISTRATION_SOURCES } from '../registration/registration-source.ts';

// One of the Organisation's newest Registrations, as the overview lists it: no guardians, answers or
// health data.
export const recentRegistrationSchema = z.object({
  id: z.uuid(),
  submittedAt: z.iso.datetime(),
  source: z.enum(REGISTRATION_SOURCES),
  turnus: z.object({ id: z.uuid(), name: z.string() }),
  camp: z.object({ id: z.uuid(), name: z.string() }),
  // Every child, Cancelled ones too, in the form's order.
  participants: z.array(z.object({ firstName: z.string(), lastName: z.string() })),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export type RecentRegistration = z.infer<typeof recentRegistrationSchema>;

// The Organisation's newest Registrations across its Turnusy, newest first, Erased ones left out;
// Registrations read.
export const listRecentRegistrationsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/recent',
  response: z.array(recentRegistrationSchema),
});
