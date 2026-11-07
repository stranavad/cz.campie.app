import { z } from 'zod';

import { pragueLocalSchema } from '@repo/schema/shared';

import { TURNUS_AVAILABILITIES } from './turnus-availability.ts';

// A Turnus as Camp settings show it: its run, its Registration window (Prague wall-clock times) and its
// price list in whole CZK. A Deposit of none is null.
export const turnusSchema = z.object({
  id: z.uuid(),
  campId: z.uuid(),
  name: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  place: z.string(),
  capacity: z.number().int(),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  opensAt: pragueLocalSchema.nullable(),
  closesAt: pragueLocalSchema.nullable(),
  closedManually: z.boolean(),
  websiteUrl: z.string().nullable(),
  basePrice: z.number().int(),
  earlyBirdPrice: z.number().int().nullable(),
  earlyBirdLastDay: z.iso.date().nullable(),
  deposit: z.number().int().nullable(),
  depositDueDays: z.number().int(),
  balanceDueDate: z.iso.date().nullable(),
  // Derived now, from the window, the switch and the Registered Participants.
  availability: z.enum(TURNUS_AVAILABILITIES),
  registered: z.number().int(),
});

export type Turnus = z.infer<typeof turnusSchema>;

export const turnusParamsSchema = z.object({ turnusId: z.uuid() });

export type TurnusParams = z.infer<typeof turnusParamsSchema>;
