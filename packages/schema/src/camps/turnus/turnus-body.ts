import { z } from 'zod';

import { calendarDateSchema, czkSchema, pragueLocalSchema, requiredText } from '@repo/schema/shared';

const ageSchema = z.number().int().min(0).max(99).nullable();
const dateSchema = calendarDateSchema;

// How many days a guardian has to pay the Deposit, as a new Turnus's form suggests.
export const DEFAULT_DEPOSIT_DUE_DAYS = 14;

// Codes of a Turnus that does not add up, which the app translates at the field they name.
export const TURNUS_ERROR_CODES = [
  'turnus_ends_before_start',
  'turnus_min_age_above_max',
  'turnus_window_closes_before_open',
  'turnus_early_bird_day_required',
  'turnus_early_bird_price_required',
] as const;

export type TurnusErrorCode = (typeof TURNUS_ERROR_CODES)[number];

// A whole Turnus as an admin enters it; create and update both take it whole. A Deposit of 0 is none.
export const turnusBodySchema = z
  .object({
    name: requiredText(120),
    startDate: dateSchema,
    endDate: dateSchema,
    place: requiredText(200),
    capacity: z.number().int().min(1).max(10_000),
    minAge: ageSchema,
    maxAge: ageSchema,
    opensAt: pragueLocalSchema.nullable(),
    closesAt: pragueLocalSchema.nullable(),
    closedManually: z.boolean(),
    // Shown to guardians; https or http only, so it cannot run script.
    websiteUrl: z.union([z.literal('').transform(() => null), z.null(), z.url({ protocol: /^https?$/ }).max(300)]),
    basePrice: czkSchema,
    earlyBirdPrice: czkSchema.nullable(),
    earlyBirdLastDay: dateSchema.nullable(),
    deposit: czkSchema.nullable().transform((deposit) => (deposit === 0 ? null : deposit)),
    depositDueDays: z.number().int().min(1).max(365),
    balanceDueDate: dateSchema.nullable(),
  })
  .superRefine((turnus, context) => {
    const problem = (path: keyof typeof turnus, message: TurnusErrorCode) =>
      context.addIssue({ code: 'custom', path: [path], message });

    // ISO dates and Prague local times compare as text.
    if (turnus.endDate < turnus.startDate) {
      problem('endDate', 'turnus_ends_before_start');
    }

    if (turnus.minAge !== null && turnus.maxAge !== null && turnus.minAge > turnus.maxAge) {
      problem('minAge', 'turnus_min_age_above_max');
    }

    if (turnus.opensAt !== null && turnus.closesAt !== null && turnus.closesAt <= turnus.opensAt) {
      problem('closesAt', 'turnus_window_closes_before_open');
    }

    if (turnus.earlyBirdPrice !== null && turnus.earlyBirdLastDay === null) {
      problem('earlyBirdLastDay', 'turnus_early_bird_day_required');
    }

    if (turnus.earlyBirdPrice === null && turnus.earlyBirdLastDay !== null) {
      problem('earlyBirdPrice', 'turnus_early_bird_price_required');
    }
  });

export type TurnusBody = z.infer<typeof turnusBodySchema>;
