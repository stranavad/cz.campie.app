import { amountDueNow, guardianShareOf, type AmountDueInput } from '@repo/schema/pricing';

import { qrPlatbaOf } from '../qr-platba/qr-platba.ts';

// The company an Invoice request names and the amount to invoice to it.
export interface InvoicedPart {
  readonly companyName: string;
  readonly amount: number;
}

export interface PaymentInstructionsInput extends AmountDueInput {
  // The whole total stays in `total`; `paid` is the guardian's payments only. The guardian is asked for the
  // total less what is invoiced.
  readonly invoice: InvoicedPart | null;
  // The Organisation's account in its canonical domestic form, or null when it has none set.
  readonly account: string | null;
  readonly variableSymbol: string;
  // The QR platba's message for the payee, such as the Camp's name.
  readonly message: string;
}

export interface PaymentInstructions {
  readonly account: string | null;
  readonly variableSymbol: string;
  // What is owed now: the Deposits, or the whole rest.
  readonly kind: 'deposit' | 'full';
  readonly amount: number;
  // Prague calendar date, or null.
  readonly dueDate: string | null;
  // While the Deposits are owed, so the amount due now is less than all outstanding: the rest after them
  // and its date, and all that is outstanding, which a guardian may pay at once instead, with its own QR
  // platba; null once the two are the same.
  readonly balance: {
    readonly amount: number;
    readonly dueDate: string | null;
    readonly outstanding: number;
    readonly qrPlatba: string | null;
  } | null;
  // The QR platba of the amount owed now; null without an account or anything to pay.
  readonly qrPlatba: string | null;
  // What an Invoice request leaves to the company, shown beside the guardian's share; null without one.
  readonly invoiced: InvoicedPart | null;
}

/**
 * Tell a guardian how to pay their share of a Registration by bank transfer: the amount due now with its
 * date, the rest after the Deposits, the QR platba of the amount due now, and what is invoiced to a company.
 * @param input the total, the guardian's payments, the dates, the Invoice request, the account, the Variable
 * symbol and the message
 */
export function paymentInstructionsOf(input: PaymentInstructionsInput): PaymentInstructions {
  const share = guardianShareOf(input.total, input.invoice?.amount ?? null);
  const due = amountDueNow({ ...input, total: share });
  const outstanding = Math.max(share - input.paid, 0);
  const rest = outstanding - due.amount;
  const qrOf = (amount: number, dueDate: string | null) =>
    input.account === null || amount === 0
      ? null
      : qrPlatbaOf({
          account: input.account,
          amount,
          variableSymbol: input.variableSymbol,
          message: input.message,
          dueDate,
        });

  return {
    account: input.account,
    variableSymbol: input.variableSymbol,
    kind: due.phase === 'deposit' ? 'deposit' : 'full',
    amount: due.amount,
    dueDate: due.dueDate,
    balance:
      due.phase === 'deposit' && rest > 0
        ? { amount: rest, dueDate: input.balanceDueDate, outstanding, qrPlatba: qrOf(outstanding, due.dueDate) }
        : null,
    qrPlatba: qrOf(due.amount, due.dueDate),
    invoiced: input.invoice,
  };
}
