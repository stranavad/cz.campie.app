import {
  PaymentGateway,
  type CreatedPayment,
  type CreatePaymentInput,
  type PaymentGatewayCredentials,
  type PaymentStatus,
} from './payment-gateway.port.ts';

// A stub until card payments are built: production boots, but no card payment can be made yet.
export class ComgatePaymentGateway extends PaymentGateway {
  public createPayment(_input: CreatePaymentInput): Promise<CreatedPayment> {
    return Promise.reject(new Error('Comgate payment gateway is not implemented'));
  }

  public getPaymentStatus(_credentials: PaymentGatewayCredentials, _transactionId: string): Promise<PaymentStatus> {
    return Promise.reject(new Error('Comgate payment gateway is not implemented'));
  }
}
