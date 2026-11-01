import { randomUUID } from 'node:crypto';

import {
  PaymentGateway,
  type CreatedPayment,
  type CreatePaymentInput,
  type PaymentGatewayCredentials,
  type PaymentStatus,
} from './payment-gateway.port.ts';

// Accepts every payment and reports it pending; nothing is charged and nothing leaves the process.
export class FakePaymentGateway extends PaymentGateway {
  public createPayment(_input: CreatePaymentInput): Promise<CreatedPayment> {
    const transactionId = randomUUID();

    return Promise.resolve({ transactionId, redirectUrl: `https://payment-gateway.invalid/pay/${transactionId}` });
  }

  public getPaymentStatus(_credentials: PaymentGatewayCredentials, _transactionId: string): Promise<PaymentStatus> {
    return Promise.resolve('pending');
  }
}
