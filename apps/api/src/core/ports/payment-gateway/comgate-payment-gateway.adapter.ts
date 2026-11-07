import { Logger } from '@nestjs/common';
import { z } from 'zod';

import {
  PaymentGateway,
  type CreatedPayment,
  type CreatePaymentInput,
  type GatewayPayment,
  type PaymentGatewayCredentials,
  type PaymentStatus,
} from './payment-gateway.port.ts';

const COMGATE_URL = 'https://payments.comgate.cz/v2.0';
// Short: a notification waits for it inside its transaction.
const TIMEOUT_MS = 5000;

// The payer is sent to the redirect, so only Comgate's own payment pages are accepted.
const createdSchema = z.object({
  code: z.literal(0),
  transId: z.string(),
  redirect: z.url({ protocol: /^https$/, hostname: /^payments\.comgate\.cz$/ }),
});
const answerSchema = z.object({ code: z.coerce.number() });

const paymentSchema = z.object({
  code: z.literal(0),
  transId: z.string(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'AUTHORIZED']),
  refId: z.string(),
  // In haléře, sometimes as a string; payments are created in whole CZK.
  price: z.coerce
    .number()
    .int()
    .positive()
    .refine((price) => price % 100 === 0),
  curr: z.literal('CZK'),
  test: z.union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')]).optional(),
});

const STATUSES = {
  PENDING: 'pending',
  AUTHORIZED: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const satisfies Record<z.infer<typeof paymentSchema>['status'], PaymentStatus>;

/**
 * The Basic authorization of an Organisation's Comgate account.
 * @param credentials the account
 */
function authorizationOf({ merchantId, secret }: PaymentGatewayCredentials): string {
  return `Basic ${Buffer.from(`${merchantId}:${secret}`).toString('base64')}`;
}

// Comgate's REST API (v2.0), with each Organisation's own account. Logs transaction ids and statuses
// only, never a secret or the payer's email.
export class ComgatePaymentGateway extends PaymentGateway {
  private readonly logger = new Logger(ComgatePaymentGateway.name);

  constructor(private readonly options: { readonly testPayments: boolean }) {
    super();

    if (options.testPayments) {
      this.logger.warn('Comgate sends test payments: no live card payment will be recorded');
    }
  }

  public async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const response = await fetch(`${COMGATE_URL}/payment.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: authorizationOf(input.credentials) },
      body: JSON.stringify({
        test: this.options.testPayments,
        price: input.amountCzk * 100,
        curr: 'CZK',
        label: input.label,
        refId: input.referenceId,
        method: 'ALL',
        email: input.email,
        url_paid: input.returnUrl,
        url_cancelled: input.returnUrl,
        url_pending: input.returnUrl,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const created = createdSchema.safeParse(await response.json().catch(() => null));

    if (!response.ok || !created.success) {
      throw new Error(`Comgate refused to create a payment (HTTP ${response.status})`);
    }

    return { transactionId: created.data.transId, redirectUrl: created.data.redirect };
  }

  public async getPayment(
    credentials: PaymentGatewayCredentials,
    transactionId: string,
  ): Promise<GatewayPayment | null> {
    const response = await fetch(`${COMGATE_URL}/payment/transId/${encodeURIComponent(transactionId)}.json`, {
      headers: { authorization: authorizationOf(credentials) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.status >= 500) {
      throw new Error(`Comgate could not report transaction ${transactionId} (HTTP ${response.status})`);
    }

    const body: unknown = await response.json().catch(() => null);
    const answer = answerSchema.safeParse(body);

    // Comgate answers a transaction of another account, or none, as an error.
    if (!response.ok || !answer.success || answer.data.code !== 0) {
      this.logger.warn(`Comgate knows no transaction ${transactionId} for this account (HTTP ${response.status})`);

      return null;
    }

    // A transaction Comgate reports in a shape not understood is not taken as unknown: failing makes
    // Comgate repeat the notification, and the error log asks for a look.
    const payment = paymentSchema.safeParse(body);

    if (!payment.success) {
      throw new Error(`Comgate reported transaction ${transactionId} in an unexpected shape`);
    }

    // A test payment is no money; a live deployment never records one, nor a test deployment a real one.
    if ((payment.data.test ?? false) !== this.options.testPayments) {
      this.logger.warn(
        `Comgate transaction ${transactionId} is ${payment.data.test === true ? 'a test' : 'a live'} payment`,
      );

      return null;
    }

    return {
      transactionId: payment.data.transId,
      status: STATUSES[payment.data.status],
      referenceId: payment.data.refId,
      amountCzk: payment.data.price / 100,
    };
  }
}
