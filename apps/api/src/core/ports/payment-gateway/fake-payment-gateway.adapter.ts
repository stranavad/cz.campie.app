import { randomUUID } from 'node:crypto';

import {
  PaymentGateway,
  type CreatedPayment,
  type CreatePaymentInput,
  type GatewayPayment,
  type PaymentGatewayCredentials,
  type PaymentStatus,
} from './payment-gateway.port.ts';

interface FakeTransaction {
  readonly input: CreatePaymentInput;
  status: PaymentStatus;
}

// Accepts every payment and reports it pending until a test settles it; nothing is charged and nothing
// leaves the process. Keeps every created payment so a test can read what the app asked for, and knows a
// transaction only to the account that created it, as the gateway does.
export class FakePaymentGateway extends PaymentGateway {
  public readonly created: (CreatedPayment & { input: CreatePaymentInput })[] = [];
  private readonly transactions = new Map<string, FakeTransaction>();

  public createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const transactionId = `FAKE-${randomUUID()}`;
    const payment = { transactionId, redirectUrl: `https://payment-gateway.invalid/pay/${transactionId}` };

    this.created.push({ input: structuredClone(input), ...payment });
    this.transactions.set(transactionId, { input: structuredClone(input), status: 'pending' });

    return Promise.resolve(payment);
  }

  public getPayment(credentials: PaymentGatewayCredentials, transactionId: string): Promise<GatewayPayment | null> {
    const transaction = this.transactions.get(transactionId);

    if (
      transaction === undefined ||
      transaction.input.credentials.merchantId !== credentials.merchantId ||
      transaction.input.credentials.secret !== credentials.secret
    ) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      transactionId,
      status: transaction.status,
      referenceId: transaction.input.referenceId,
      amountCzk: transaction.input.amountCzk,
    });
  }

  /**
   * Settle a created transaction as the payer would: paid, or cancelled.
   * @param transactionId the transaction
   * @param status its new status
   */
  public settle(transactionId: string, status: PaymentStatus): void {
    const transaction = this.transactions.get(transactionId);

    if (transaction === undefined) {
      throw new Error(`The fake gateway created no transaction ${transactionId}`);
    }

    transaction.status = status;
  }
}
