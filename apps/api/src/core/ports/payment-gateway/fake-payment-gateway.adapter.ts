import { randomUUID } from 'node:crypto';

import {
  PaymentGateway,
  type CreatedPayment,
  type CreatePaymentInput,
  type PaymentGatewayCredentials,
  type PaymentStatus,
} from './payment-gateway.port.ts';

// Accepts every payment and reports it pending; nothing is charged and nothing leaves the process. Keeps
// every created payment so a test can read what the app asked for.
export class FakePaymentGateway extends PaymentGateway {
  public readonly created: (CreatedPayment & { input: CreatePaymentInput })[] = [];

  public createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const transactionId = randomUUID();
    const payment = { transactionId, redirectUrl: `https://payment-gateway.invalid/pay/${transactionId}` };

    this.created.push({ input: structuredClone(input), ...payment });

    return Promise.resolve(payment);
  }

  public getPaymentStatus(_credentials: PaymentGatewayCredentials, _transactionId: string): Promise<PaymentStatus> {
    return Promise.resolve('pending');
  }
}
