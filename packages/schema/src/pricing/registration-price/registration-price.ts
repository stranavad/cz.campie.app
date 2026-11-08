import { pragueDateOf } from '@repo/schema/shared';

// What a line of a Registration's price is. Stored with the Registration at submission and shown as is
// later, so these never change meaning; renderers name each kind, and print `label` where it is data.
export const PRICE_LINE_KINDS = [
  'base_price',
  'early_bird_price',
  'paid_extra',
  'claimed_discount',
  'sibling_discount',
  'discount_code',
  'zero_floor',
] as const;

export type PriceLineKind = (typeof PRICE_LINE_KINDS)[number];

export interface PriceLine {
  readonly kind: PriceLineKind;
  // The Participant's position in the Registration, or null for the Registration as a whole.
  readonly participant: number | null;
  // The form answer's label of a Paid extra or Claimed discount, or the Discount code; null otherwise.
  readonly label: string | null;
  // Whole CZK, negative for a discount.
  readonly amount: number;
  // The form answer a Paid extra or Claimed discount comes from, so it can be taken back exactly.
  readonly source?: SurchargeSource;
}

export interface SurchargeSource {
  readonly fieldId: string;
  // The chosen option, or null for a yes.
  readonly optionId: string | null;
}

export interface PriceList {
  readonly basePrice: number;
  readonly earlyBirdPrice: number | null;
  // Inclusive, on the Prague calendar.
  readonly earlyBirdLastDay: string | null;
  // Per child; null when the Turnus has none.
  readonly deposit: number | null;
  readonly balanceDueDate: string | null;
}

// Whom the Sibling discount goes to, when a Registration holds more than one Participant.
export const SIBLING_DISCOUNT_MODES = ['every_child', 'from_second_child'] as const;

export type SiblingDiscountMode = (typeof SIBLING_DISCOUNT_MODES)[number];

export interface SiblingDiscount {
  // Per child, whole CZK.
  readonly amount: number;
  readonly appliesTo: SiblingDiscountMode;
}

export const DISCOUNT_CODE_KINDS = ['percentage', 'fixed'] as const;

export type DiscountCodeKind = (typeof DISCOUNT_CODE_KINDS)[number];

export interface DiscountCode {
  readonly code: string;
  readonly kind: DiscountCodeKind;
  // A percentage, or whole CZK.
  readonly value: number;
}

// Whether a guardian pays the whole price at once or the Deposit first.
export const PAYMENT_CHOICES = ['full', 'deposit'] as const;

export type PaymentChoice = (typeof PAYMENT_CHOICES)[number];

export interface PricingInput {
  readonly priceList: PriceList;
  // The Camp's, null when it has none.
  readonly siblingDiscount: SiblingDiscount | null;
  // Each Participant's surcharges from the form's answers: positive Paid extras, negative Claimed discounts.
  readonly participants: readonly {
    readonly surcharges: readonly {
      readonly label: string;
      readonly amount: number;
      readonly fieldId?: string;
      readonly optionId?: string | null;
    }[];
  }[];
  readonly discountCode: DiscountCode | null;
  readonly paymentChoice: PaymentChoice;
  readonly submittedAt: Date;
}

export interface RegistrationPrice {
  readonly lines: readonly PriceLine[];
  // The lines' sum, never below zero.
  readonly total: number;
  // Whether the form may offer paying the Deposit first.
  readonly depositAvailable: boolean;
  // What is owed first when the Deposit was chosen and is available; null when paying in full.
  readonly depositTotal: number | null;
}

/**
 * Tell a child's price at an instant: the Early bird price through its last day in Prague, else the Base
 * price.
 * @param priceList the Turnus's prices
 * @param at the instant, such as a submission or now
 */
export function priceInForce(
  priceList: Pick<PriceList, 'basePrice' | 'earlyBirdPrice' | 'earlyBirdLastDay'>,
  at: Date,
): { kind: 'base_price' | 'early_bird_price'; amount: number } {
  const { basePrice, earlyBirdPrice, earlyBirdLastDay } = priceList;

  return earlyBirdPrice !== null && earlyBirdLastDay !== null && pragueDateOf(at) <= earlyBirdLastDay
    ? { kind: 'early_bird_price', amount: earlyBirdPrice }
    : { kind: 'base_price', amount: basePrice };
}

const sum = (lines: readonly PriceLine[]) => lines.reduce((total, { amount }) => total + amount, 0);

/**
 * Price a Registration. Each child pays the Base price, or the Early bird price when submitted by its last
 * day in Prague, plus their surcharges. A percentage Discount code comes off the children's prices before
 * the Sibling discount, never off surcharges; a fixed one off the total after it. The Sibling discount
 * needs more than one Participant. The total never goes below zero.
 * @param input the price list, the Camp's Sibling discount, the children's surcharges, the code, the
 * payment choice and the submission instant
 */
export function priceRegistration(input: PricingInput): RegistrationPrice {
  const { priceList, siblingDiscount, participants, discountCode, paymentChoice, submittedAt } = input;
  const submittedOn = pragueDateOf(submittedAt);
  const childPrice = priceInForce(priceList, submittedAt);

  const childPrices: PriceLine[] = participants.map((_, participant) => ({ ...childPrice, participant, label: null }));
  const surcharges: PriceLine[] = participants.flatMap(({ surcharges: answers }, participant) =>
    answers.map(({ label, amount, fieldId, optionId }) => ({
      kind: amount < 0 ? 'claimed_discount' : 'paid_extra',
      participant,
      label,
      amount,
      ...(fieldId === undefined ? {} : { source: { fieldId, optionId: optionId ?? null } }),
    })),
  );
  const percentageLine = discountCode === null ? null : percentageCodeLine(discountCode, sum(childPrices), null);
  const percentage: PriceLine[] = percentageLine === null ? [] : [percentageLine];
  const siblings: PriceLine[] =
    siblingDiscount === null || participants.length < 2
      ? []
      : participants.flatMap((_, participant) =>
          siblingDiscount.appliesTo === 'from_second_child' && participant === 0
            ? []
            : [{ kind: 'sibling_discount', participant, label: null, amount: -siblingDiscount.amount }],
        );
  const beforeFixed = [...childPrices, ...surcharges, ...percentage, ...siblings];
  const fixed: PriceLine[] =
    discountCode?.kind === 'fixed'
      ? [codeLine(discountCode, -Math.max(0, Math.min(discountCode.value, sum(beforeFixed))))]
      : [];

  const lines = floorAtZero(capCode([...beforeFixed, ...fixed]));
  const total = sum(lines);
  const { deposit, balanceDueDate } = priceList;
  const depositAvailable =
    deposit !== null &&
    deposit > 0 &&
    participants.length > 0 &&
    (balanceDueDate === null || submittedOn <= balanceDueDate);
  const depositTotal =
    depositAvailable && paymentChoice === 'deposit' ? Math.min(deposit * participants.length, total) : null;

  return { lines, total, depositAvailable, depositTotal };
}

/**
 * Take a percentage Discount code off children's prices, as its line; a fixed code has none here, since it
 * comes off the total once. Surcharges and the Sibling discount are never part of the prices.
 * @param code the Registration's code
 * @param childPrices the Base or Early bird prices of the children it applies to
 * @param participant the one child it applies to, or null for the whole Registration
 */
export function percentageCodeLine(
  code: DiscountCode,
  childPrices: number,
  participant: number | null,
): PriceLine | null {
  if (code.kind !== 'percentage') {
    return null;
  }

  const line = codeLine(code, -Math.round((childPrices * Math.max(0, code.value)) / 100));

  return { ...line, participant };
}

/**
 * Build the Discount code's line.
 * @param code the code
 * @param amount whole CZK, zero or negative
 */
function codeLine({ code }: DiscountCode, amount: number): PriceLine {
  // Negating nothing gives -0, which stored JSON and comparisons would tell from 0.
  return { kind: 'discount_code', participant: null, label: code, amount: amount === 0 ? 0 : amount };
}

/**
 * Take back as much of the Discount code as would push the total below zero.
 * @param lines the lines
 */
function capCode(lines: PriceLine[]): PriceLine[] {
  const excess = -Math.min(0, sum(lines));

  return lines.map((line) =>
    line.kind === 'discount_code' && excess > 0
      ? { ...line, amount: Math.min(0, line.amount + Math.min(excess, -line.amount)) }
      : line,
  );
}

/**
 * Add a line that brings a negative total to zero, when discounts besides the code exceed the price.
 * @param lines the lines
 */
function floorAtZero(lines: PriceLine[]): PriceLine[] {
  const total = sum(lines);

  return total >= 0 ? lines : [...lines, { kind: 'zero_floor', participant: null, label: null, amount: -total }];
}
