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
  // What the payer sees the payment as; at most 16 characters.
  label: string;
  email: string;
}

export interface CreatedPayment {
  transactionId: string;
  // Where the guardian is sent to pay.
  redirectUrl: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

// A transaction as the gateway reports it to the account it belongs to.
export interface GatewayPayment {
  transactionId: string;
  status: PaymentStatus;
  referenceId: string;
  amountCzk: number;
}

export abstract class PaymentGateway {
  /**
   * Create a card payment at the gateway.
   * @param input account, amount and what the payment is for
   */
  public abstract createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;

  /**
   * Ask the gateway for one of its transactions; rejects when the gateway cannot be reached, so the caller
   * may try again.
   * @param credentials the account the transaction must belong to
   * @param transactionId the gateway's transaction id
   * @returns the transaction, or null when the account knows no such transaction
   */
  public abstract getPayment(
    credentials: PaymentGatewayCredentials,
    transactionId: string,
  ): Promise<GatewayPayment | null>;
}
