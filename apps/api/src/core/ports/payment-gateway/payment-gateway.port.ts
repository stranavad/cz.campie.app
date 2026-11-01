// The gateway account of one Organisation; each Organisation brings its own.
export interface PaymentGatewayCredentials {
  merchantId: string;
  secret: string;
}

export interface CreatePaymentInput {
  credentials: PaymentGatewayCredentials;
  // Our identifier, which the gateway reports back with the payment.
  referenceId: string;
  amountCzk: number;
  label: string;
  email: string;
}

export interface CreatedPayment {
  transactionId: string;
  // Where the guardian is sent to pay.
  redirectUrl: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export abstract class PaymentGateway {
  /**
   * Create a card payment at the gateway.
   * @param input account, amount and what the payment is for
   */
  public abstract createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;

  /**
   * Ask the gateway for the status of one of its transactions; rejects for an unknown one.
   * @param credentials the account the transaction belongs to
   * @param transactionId the gateway's transaction id
   */
  public abstract getPaymentStatus(
    credentials: PaymentGatewayCredentials,
    transactionId: string,
  ): Promise<PaymentStatus>;
}
