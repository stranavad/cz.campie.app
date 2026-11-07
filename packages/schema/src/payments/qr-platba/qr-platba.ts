// QR platba: the Czech banks' Short Payment Descriptor (SPAYD), which a banking app reads from a QR code.

const DOMESTIC_ACCOUNT = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/;

// The banks' apps read at most this much of a message.
const MAX_MESSAGE = 60;

export interface QrPayment {
  // A Czech account in its canonical domestic form, as `bankAccountSchema` gives it.
  readonly account: string;
  // Whole CZK.
  readonly amount: number;
  readonly variableSymbol: string;
  // For the payee, such as the Camp's name.
  readonly message: string;
  // Prague calendar date, or null for none.
  readonly dueDate: string | null;
}

/**
 * Turn a Czech account in its domestic form into its IBAN.
 * @param account prefix-number/bank code, as `bankAccountSchema` gives it
 * @throws {Error} when the account is not in that form
 */
export function ibanOf(account: string): string {
  const [, prefix = '', number, bankCode] = DOMESTIC_ACCOUNT.exec(account) ?? [];

  if (number === undefined || bankCode === undefined) {
    throw new Error('The account is not a Czech account in its domestic form');
  }

  const bban = `${bankCode}${prefix.padStart(6, '0')}${number.padStart(10, '0')}`;
  // CZ as digits (C = 12, Z = 35) and 00 in place of the check digits, by the ISO 13616 rule.
  const remainder = Number(BigInt(`${bban}123500`) % 97n);

  return `CZ${String(98 - remainder).padStart(2, '0')}${bban}`;
}

/**
 * Write a message as every banking app shows it: without diacritics, in capitals, with no asterisk (the
 * descriptor's separator), at most 60 characters.
 * @param message the message
 */
function plainMessage(message: string): string {
  return message
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .replaceAll('*', '')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, MAX_MESSAGE);
}

/**
 * Build the QR platba of a payment to a Czech account in CZK.
 * @param payment the account, amount, Variable symbol, message and due date
 */
export function qrPlatbaOf(payment: QrPayment): string {
  const fields = [
    `ACC:${ibanOf(payment.account)}`,
    `AM:${payment.amount.toFixed(2)}`,
    'CC:CZK',
    `X-VS:${payment.variableSymbol}`,
    ...(payment.dueDate === null ? [] : [`DT:${payment.dueDate.replaceAll('-', '')}`]),
    `MSG:${plainMessage(payment.message)}`,
  ];

  return ['SPD', '1.0', ...fields].join('*');
}
