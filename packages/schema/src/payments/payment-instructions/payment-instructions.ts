import { amountDueNow, type AmountDueInput } from '@repo/schema/pricing';

import { qrPlatbaOf } from '../qr-platba/qr-platba.ts';

export interface PaymentInstructionsInput extends AmountDueInput {
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
  // While the Deposits are owed: the rest after them and its date, and all that is outstanding, which a
  // guardian may pay at once instead.
  readonly balance: { readonly amount: number; readonly dueDate: string | null; readonly outstanding: number } | null;
  // The QR platba of the amount owed now; null without an account or anything to pay.
  readonly qrPlatba: string | null;
}

/**
 * Tell a guardian how to pay a Registration by bank transfer: the amount due now with its date, the rest
 * after the Deposits, and the QR platba of the amount due now.
 * @param input the totals, payments and dates, the account, the Variable symbol and the message
 */
export function paymentInstructionsOf(input: PaymentInstructionsInput): PaymentInstructions {
  const due = amountDueNow(input);
  const outstanding = Math.max(input.total - input.paid, 0);
  const rest = outstanding - due.amount;

  return {
    account: input.account,
    variableSymbol: input.variableSymbol,
    kind: due.phase === 'deposit' ? 'deposit' : 'full',
    amount: due.amount,
    dueDate: due.dueDate,
    balance: due.phase === 'deposit' && rest > 0 ? { amount: rest, dueDate: input.balanceDueDate, outstanding } : null,
    qrPlatba:
      input.account === null || due.amount === 0
        ? null
        : qrPlatbaOf({
            account: input.account,
            amount: due.amount,
            variableSymbol: input.variableSymbol,
            message: input.message,
            dueDate: due.dueDate,
          }),
  };
}
