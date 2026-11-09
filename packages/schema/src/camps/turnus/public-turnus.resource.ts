import { z } from 'zod';

import { TURNUS_AVAILABILITIES } from './turnus-availability.ts';

// A Turnus as its Camp's public page shows it: no capacity or counts, only the places left, and the
// price that applies today.
export const publicTurnusSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  place: z.string(),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  websiteUrl: z.string().nullable(),
  basePrice: z.number().int(),
  earlyBirdPrice: z.number().int().nullable(),
  earlyBirdLastDay: z.iso.date().nullable(),
  // The Early bird price while it is in force, else the Base price.
  priceNow: z.number().int(),
  // Per child; null when the Turnus has none.
  deposit: z.number().int().nullable(),
  // Instants, for the countdown to the opening.
  opensAt: z.iso.datetime().nullable(),
  closesAt: z.iso.datetime().nullable(),
  availability: z.enum(TURNUS_AVAILABILITIES),
  remainingPlaces: z.number().int(),
});

export type PublicTurnus = z.infer<typeof publicTurnusSchema>;
