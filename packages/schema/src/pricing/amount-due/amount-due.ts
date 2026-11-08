import { addDays, pragueDateOf } from '@repo/schema/shared';

// The dates a Registration's money is due by, fixed when it joins its Turnus and stored with it, so editing
// the Turnus later never moves them.
export interface DueDates {
  // Prague calendar date the Deposits are due by, or everything when paying in full.
  readonly depositDueDate: string;
  // Prague calendar date the rest is due by; null when the Turnus sets none.
  readonly balanceDueDate: string | null;
}

export interface DueTerms {
  readonly submittedAt: Date;
  // The Turnus's "Deposit due within N days of submission".
  readonly depositDueDays: number;
  readonly balanceDueDate: string | null;
}

export interface AmountDueInput extends DueDates {
  // The Registration's total from its stored lines and Price adjustments.
  readonly total: number;
  // What is owed first when the Deposit was chosen; null when paying in full.
  readonly depositTotal: number | null;
  // The ledger's sum.
  readonly paid: number;
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
 * Fix a Registration's due dates from its submission and its Turnus's terms. The deposit date is the Prague
 * date of submission plus the deposit days, never after the balance due date unless submitted after it.
 * @param terms the submission instant and the Turnus's deposit days and balance due date
 */
export function dueDatesOf(terms: DueTerms): DueDates {
  const { submittedAt, depositDueDays, balanceDueDate } = terms;
  const submittedOn = pragueDateOf(submittedAt);
  const submittedLate = balanceDueDate !== null && submittedOn > balanceDueDate;

  return {
    // A Deposit is never due after the balance, or paying it on time would leave the Registration Overdue.
    // One submitted after the balance due date was offered no Deposit and owes all within the deposit days.
    depositDueDate: earlier(addDays(submittedOn, depositDueDays), submittedLate ? null : balanceDueDate),
    balanceDueDate,
  };
}

/**
 * Tell what a Registration owes now and by when. With the Deposit chosen: the Deposits until they are
 * covered, by the deposit date, then the rest by the balance due date. Paying in full: the rest by the
 * deposit date, which is never after the balance due date.
 * @param input the totals, the payments and the Registration's due dates
 */
export function amountDueNow(input: AmountDueInput): AmountDue {
  const { total, depositTotal, paid, depositDueDate, balanceDueDate } = input;
  // Price adjustments may have brought the total below the Deposits.
  const deposits = depositTotal === null ? null : Math.min(depositTotal, total);

  if (paid >= total) {
    return { phase: 'settled', amount: 0, dueDate: null };
  }

  if (deposits !== null && paid < deposits) {
    return { phase: 'deposit', amount: deposits - paid, dueDate: depositDueDate };
  }

  if (deposits !== null) {
    return { phase: 'balance', amount: total - paid, dueDate: balanceDueDate };
  }

  return { phase: 'full', amount: total - paid, dueDate: depositDueDate };
}

/**
 * Pick the earlier of a date and an optional one.
 * @param date YYYY-MM-DD
 * @param other YYYY-MM-DD, or null for none
 */
function earlier(date: string, other: string | null): string {
  return other !== null && other < date ? other : date;
}
