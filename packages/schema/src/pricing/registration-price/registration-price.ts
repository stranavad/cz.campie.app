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

export interface SiblingDiscount {
  // Per child, whole CZK.
  readonly amount: number;
  readonly appliesTo: 'every_child' | 'from_second_child';
}

export interface DiscountCode {
  readonly code: string;
  readonly kind: 'percentage' | 'fixed';
  // A percentage, or whole CZK.
  readonly value: number;
}

export interface PricingInput {
  readonly priceList: PriceList;
  // The Camp's, null when it has none.
  readonly siblingDiscount: SiblingDiscount | null;
  // Each Participant's surcharges from the form's answers: positive Paid extras, negative Claimed discounts.
  readonly participants: readonly {
    readonly surcharges: readonly { readonly label: string; readonly amount: number }[];
  }[];
  readonly discountCode: DiscountCode | null;
  readonly paymentChoice: 'full' | 'deposit';
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
  const { earlyBirdPrice, earlyBirdLastDay } = priceList;
  const childPrice: Pick<PriceLine, 'kind' | 'amount'> =
    earlyBirdPrice !== null && earlyBirdLastDay !== null && submittedOn <= earlyBirdLastDay
      ? { kind: 'early_bird_price', amount: earlyBirdPrice }
      : { kind: 'base_price', amount: priceList.basePrice };

  const childPrices: PriceLine[] = participants.map((_, participant) => ({ ...childPrice, participant, label: null }));
  const surcharges: PriceLine[] = participants.flatMap(({ surcharges: answers }, participant) =>
    answers.map(({ label, amount }) => ({
      kind: amount < 0 ? 'claimed_discount' : 'paid_extra',
      participant,
      label,
      amount,
    })),
  );
  const percentage: PriceLine[] =
    discountCode?.kind === 'percentage'
      ? [codeLine(discountCode, -Math.round((sum(childPrices) * Math.max(0, discountCode.value)) / 100))]
      : [];
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
