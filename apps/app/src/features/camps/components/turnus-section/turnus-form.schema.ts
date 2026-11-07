import { z } from 'zod';

import { DEFAULT_DEPOSIT_DUE_DAYS, turnusBodySchema, type Turnus, type TurnusBody } from '@repo/schema/camps';

// What the inputs hold: text, as typed. Turned into the contract's Turnus on the way out, so its rules
// report at the same fields.
const turnusInputSchema = z.object({
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  place: z.string(),
  capacity: z.string(),
  minAge: z.string(),
  maxAge: z.string(),
  opensAt: z.string(),
  closesAt: z.string(),
  closedManually: z.boolean(),
  websiteUrl: z.string(),
  basePrice: z.string(),
  earlyBirdPrice: z.string(),
  earlyBirdLastDay: z.string(),
  deposit: z.string(),
  depositDueDays: z.string(),
  balanceDueDate: z.string(),
});

export type TurnusFormValues = z.input<typeof turnusInputSchema>;

const numberOrNull = (text: string) => (text.trim() === '' ? null : Number(text));
// An empty required number is no number, so it is reported as missing rather than taken as 0.
const requiredNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text));
const textOrNull = (text: string) => (text.trim() === '' ? null : text);

/**
 * Read the inputs as the contract's Turnus, unchecked.
 * @param values the inputs
 */
function asBody(values: TurnusFormValues) {
  return {
    ...values,
    capacity: requiredNumber(values.capacity),
    minAge: numberOrNull(values.minAge),
    maxAge: numberOrNull(values.maxAge),
    opensAt: textOrNull(values.opensAt),
    closesAt: textOrNull(values.closesAt),
    basePrice: requiredNumber(values.basePrice),
    earlyBirdPrice: numberOrNull(values.earlyBirdPrice),
    earlyBirdLastDay: textOrNull(values.earlyBirdLastDay),
    deposit: numberOrNull(values.deposit),
    depositDueDays: requiredNumber(values.depositDueDays),
    balanceDueDate: textOrNull(values.balanceDueDate),
  };
}

// The inputs checked by the contract's rules, each problem at the input it concerns.
export const turnusFormSchema = turnusInputSchema.superRefine((values, context) => {
  for (const issue of turnusBodySchema.safeParse(asBody(values)).error?.issues ?? []) {
    context.addIssue({ code: 'custom', path: issue.path, message: issue.message });
  }
});

/**
 * Turn checked inputs into the Turnus the API takes.
 * @param values the inputs
 * @throws {ZodError} when the inputs break the contract's rules
 */
export function turnusBodyOf(values: TurnusFormValues): TurnusBody {
  return turnusBodySchema.parse(asBody(values));
}

const text = (value: number | string | null) => (value === null ? '' : String(value));

/**
 * Fill the form from a saved Turnus, or with a new Turnus's defaults.
 * @param turnus the Turnus, or null for a new one
 */
export function turnusFormValues(turnus: Turnus | null): TurnusFormValues {
  return {
    name: turnus?.name ?? '',
    startDate: turnus?.startDate ?? '',
    endDate: turnus?.endDate ?? '',
    place: turnus?.place ?? '',
    capacity: text(turnus?.capacity ?? null),
    minAge: text(turnus?.minAge ?? null),
    maxAge: text(turnus?.maxAge ?? null),
    opensAt: turnus?.opensAt ?? '',
    closesAt: turnus?.closesAt ?? '',
    closedManually: turnus?.closedManually ?? false,
    websiteUrl: turnus?.websiteUrl ?? '',
    basePrice: text(turnus?.basePrice ?? null),
    earlyBirdPrice: text(turnus?.earlyBirdPrice ?? null),
    earlyBirdLastDay: turnus?.earlyBirdLastDay ?? '',
    deposit: text(turnus?.deposit ?? null),
    depositDueDays: text(turnus?.depositDueDays ?? DEFAULT_DEPOSIT_DUE_DAYS),
    balanceDueDate: turnus?.balanceDueDate ?? '',
  };
}
