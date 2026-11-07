import { addDays, pragueDateOf } from '@repo/schema/shared';

export interface AmountDueInput {
  // The Registration's total from its stored lines and Price adjustments.
  readonly total: number;
  // What is owed first when the Deposit was chosen; null when paying in full.
  readonly depositTotal: number | null;
  // The ledger's sum.
  readonly paid: number;
  readonly submittedAt: Date;
  // The Turnus's "Deposit due within N days of submission".
  readonly depositDueDays: number;
  readonly balanceDueDate: string | null;
}

export const AMOUNT_DUE_PHASES = ['deposit', 'balance', 'full', 'settled'] as const;

export type AmountDuePhase = (typeof AMOUNT_DUE_PHASES)[number];

export interface AmountDue {
  readonly phase: AmountDuePhase;
  // Whole CZK, never negative.
  readonly amount: number;
  // Prague calendar date, null when nothing is due or no date is set.
  readonly dueDate: string | null;
}

/**
 * Tell what a Registration owes now and by when. With the Deposit chosen: the Deposits until they are
 * covered, by the deposit date, then the rest by the balance due date. Paying in full: the rest by the
 * earlier of the two dates. The deposit date is the Prague date of submission plus the deposit days.
 * @param input the totals, the payments and the dates
 */
export function amountDueNow(input: AmountDueInput): AmountDue {
  const { total, depositTotal, paid, submittedAt, depositDueDays, balanceDueDate } = input;
  const submittedOn = pragueDateOf(submittedAt);
  const submittedLate = balanceDueDate !== null && submittedOn > balanceDueDate;
  // A Deposit is never due after the balance, or paying it on time would leave the Registration Overdue.
  const depositDate = earlier(addDays(submittedOn, depositDueDays), submittedLate ? null : balanceDueDate);
  // Price adjustments may have brought the total below the Deposits.
  const deposits = depositTotal === null ? null : Math.min(depositTotal, total);

  if (paid >= total) {
    return { phase: 'settled', amount: 0, dueDate: null };
  }

  if (deposits !== null && paid < deposits) {
    return { phase: 'deposit', amount: deposits - paid, dueDate: depositDate };
  }

  if (deposits !== null) {
    return { phase: 'balance', amount: total - paid, dueDate: balanceDueDate };
  }

  // A Registration submitted after the balance due date was offered no Deposit and owes all within the
  // deposit days, which the deposit date already is.
  return { phase: 'full', amount: total - paid, dueDate: depositDate };
}

/**
 * Pick the earlier of a date and an optional one.
 * @param date YYYY-MM-DD
 * @param other YYYY-MM-DD, or null for none
 */
function earlier(date: string, other: string | null): string {
  return other !== null && other < date ? other : date;
}
