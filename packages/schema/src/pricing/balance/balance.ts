import { amountDueNow, type AmountDue } from '../amount-due/amount-due.ts';

// What a Registration's ledger says of its payment; derived, never stored. Paying less than the Deposits
// leaves it unpaid.
export const PAYMENT_STATUSES = ['unpaid', 'deposit_paid', 'paid', 'overpaid'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface BalanceInput {
  // The price lines frozen at submission.
  readonly lines: readonly { readonly amount: number }[];
  // Price adjustments, plus or minus.
  readonly adjustments: readonly { readonly amount: number }[];
  // Ledger entries: payments positive, Correcting payments negative.
  readonly payments: readonly { readonly amount: number }[];
  // Owed first when the Deposit was chosen; null when paying in full.
  readonly depositTotal: number | null;
  readonly submittedAt: Date;
  readonly depositDueDays: number;
  readonly balanceDueDate: string | null;
}

export interface Balance {
  // The lines and Price adjustments, which never take it below zero.
  readonly total: number;
  readonly paid: number;
  // What is left to pay; negative when overpaid.
  readonly balance: number;
  readonly status: PaymentStatus;
  readonly amountDue: AmountDue;
  // The amount due now is unpaid past its date.
  readonly overdue: boolean;
}

const sum = (entries: readonly { readonly amount: number }[]) =>
  entries.reduce((total, { amount }) => total + amount, 0);

/**
 * Derive a Registration's total, payments, status and amount due now from its lines, Price adjustments and
 * ledger, as of a Prague calendar date. A payment below the Deposits leaves it unpaid.
 * @param input the lines, adjustments, ledger, Deposit and dates
 * @param today the Prague calendar date now, YYYY-MM-DD
 */
export function balanceOf(input: BalanceInput, today: string): Balance {
  const total = Math.max(sum(input.lines) + sum(input.adjustments), 0);
  const paid = sum(input.payments);
  const amountDue = amountDueNow({ ...input, total, paid });
  const deposits = input.depositTotal === null ? null : Math.min(input.depositTotal, total);

  return {
    total,
    paid,
    balance: total - paid,
    status: statusOf(total, paid, deposits),
    amountDue,
    overdue: amountDue.amount > 0 && amountDue.dueDate !== null && today > amountDue.dueDate,
  };
}

/**
 * Name what is paid against the total and the Deposits owed.
 * @param total the total
 * @param paid the ledger's sum
 * @param deposits the Deposits owed, or null when paying in full
 */
function statusOf(total: number, paid: number, deposits: number | null): PaymentStatus {
  if (paid > total) {
    return 'overpaid';
  }

  if (paid === total) {
    return 'paid';
  }

  return deposits !== null && paid >= deposits && paid > 0 ? 'deposit_paid' : 'unpaid';
}
