import { amountDueNow, type AmountDue, type DueDates } from '../amount-due/amount-due.ts';

// What a Registration's ledger says of its payment; derived, never stored. Something paid that covers
// neither the Deposits nor, paying in full, the total is partly paid.
export const PAYMENT_STATUSES = ['unpaid', 'partly_paid', 'deposit_paid', 'paid', 'overpaid'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Who a ledger entry's money came from: the guardian, or the company an Invoice request names.
export const PAYERS = ['guardian', 'company'] as const;

export type Payer = (typeof PAYERS)[number];

export interface BalanceInput extends DueDates {
  // The price lines frozen at submission.
  readonly lines: readonly { readonly amount: number }[];
  // Price adjustments, plus or minus.
  readonly adjustments: readonly { readonly amount: number }[];
  // Ledger entries: payments positive, Correcting payments negative.
  readonly payments: readonly { readonly amount: number; readonly payer: Payer }[];
  // The amount an Invoice request asks to invoice to a company; null without one.
  readonly invoiced: number | null;
  // Owed first when the Deposit was chosen; null when paying in full.
  readonly depositTotal: number | null;
}

export interface Balance {
  // The lines and Price adjustments, which never take it below zero.
  readonly total: number;
  readonly paid: number;
  // What is left to pay; negative when overpaid.
  readonly balance: number;
  readonly status: PaymentStatus;
  // Of the guardian's share and the guardian's payments only.
  readonly amountDue: AmountDue;
  // The amount due now is unpaid past its date, whether partly paid or not at all.
  readonly overdue: boolean;
  // What the guardian owes: the total less the amount invoiced, never below zero; the whole total without
  // an Invoice request.
  readonly guardian: { readonly share: number; readonly paid: number; readonly balance: number };
  // What is left for the company to pay, with no due date; null without an Invoice request.
  readonly company: { readonly invoiced: number; readonly paid: number; readonly balance: number } | null;
}

const sum = (entries: readonly { readonly amount: number }[]) =>
  entries.reduce((total, { amount }) => total + amount, 0);

/**
 * Tell the guardian's share of a total: what is not invoiced to a company, never below zero.
 * @param total the Registration's total
 * @param invoiced the amount to invoice, or null without an Invoice request
 */
export function guardianShareOf(total: number, invoiced: number | null): number {
  return Math.max(total - (invoiced ?? 0), 0);
}

/**
 * Derive a Registration's total, payments, status and amount due now from its lines, Price adjustments,
 * ledger, Invoice request and stored due dates, as of a Prague calendar date. The amount due now and
 * Overdue follow the guardian's share and payments; the status covers the whole total and every payment.
 * @param input the lines, adjustments, ledger, amount invoiced, Deposit and due dates
 * @param today the Prague calendar date now, YYYY-MM-DD
 */
export function balanceOf(input: BalanceInput, today: string): Balance {
  const total = Math.max(sum(input.lines) + sum(input.adjustments), 0);
  const paid = sum(input.payments);
  const share = guardianShareOf(total, input.invoiced);
  const guardianPaid = sum(input.payments.filter(({ payer }) => payer === 'guardian'));
  const amountDue = amountDueNow({ ...input, total: share, paid: guardianPaid });
  const deposits = input.depositTotal === null ? null : Math.min(input.depositTotal, total);
  const companyPaid = paid - guardianPaid;

  return {
    total,
    paid,
    balance: total - paid,
    status: statusOf(total, paid, deposits),
    amountDue,
    overdue: amountDue.amount > 0 && amountDue.dueDate !== null && today > amountDue.dueDate,
    guardian: { share, paid: guardianPaid, balance: share - guardianPaid },
    company:
      input.invoiced === null
        ? null
        : { invoiced: input.invoiced, paid: companyPaid, balance: input.invoiced - companyPaid },
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

  if (paid <= 0) {
    return 'unpaid';
  }

  return deposits !== null && paid >= deposits ? 'deposit_paid' : 'partly_paid';
}
