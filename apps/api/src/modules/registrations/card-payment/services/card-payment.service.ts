import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { PaymentGateway, type CreatedPayment } from '../../../../core/ports/payment-gateway/payment-gateway.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { PaymentGatewayService } from '../../../organisations/payment-gateway/services/payment-gateway.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';

const registrationIdSchema = z.uuid();

// Card payments through the Organisation's own Comgate account: creating one for a Registration, and
// recording one Comgate reports paid. Logs ids only.
@Injectable()
export class CardPaymentService {
  private readonly logger = new Logger(CardPaymentService.name);
  private readonly limit: RequestLimit;

  constructor(
    private readonly gatewayAccounts: PaymentGatewayService,
    private readonly gateway: PaymentGateway,
    private readonly registrations: RegistrationRepository,
    private readonly ledger: LedgerService,
    private readonly unitOfWork: UnitOfWork,
    private readonly rateLimiter: RateLimiter,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).gatewayNotification;
  }

  /**
   * Create a card payment of a Registration with the current Organisation's Comgate account.
   * @param registrationId Registration id
   * @param amountCzk the amount to pay
   * @returns the payment to send the guardian to, or null when the Organisation takes no card payments
   */
  public async create(registrationId: string, amountCzk: number): Promise<CreatedPayment | null> {
    const credentials = await this.gatewayAccounts.credentials();

    if (credentials === null) {
      return null;
    }

    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const [guardian] = await this.registrations.listGuardians(registrationId);

    return this.gateway.createPayment({
      credentials,
      referenceId: registration.id,
      amountCzk,
      label: `VS ${registration.variableSymbol}`,
      email: guardian?.email ?? '',
    });
  }

  /**
   * Handle Comgate's notification of a transaction: fetch its status with the current Organisation's keys,
   * never trusting the notification, and record it once paid. A transaction the account does not know, one
   * not paid, or one of a Registration this Organisation has not is ignored.
   * Anyone may post one, and each costs a call to Comgate, so they are limited per address and Organisation.
   * @param transactionId Comgate's transaction id
   * @param ipAddress where the notification came from
   */
  public async handleNotification(transactionId: string, ipAddress: string): Promise<void> {
    await this.rateLimiter.admit(this.limit, { ipAddress, target: this.unitOfWork.organisationId });
    const credentials = await this.gatewayAccounts.credentials();

    if (credentials === null) {
      this.logger.warn(
        `Notification of ${transactionId} to Organisation ${this.unitOfWork.organisationId} without Comgate keys`,
      );

      return;
    }

    const payment = await this.gateway.getPayment(credentials, transactionId);

    if (payment === null || payment.status !== 'paid' || payment.amountCzk <= 0) {
      return;
    }

    const registrationId = registrationIdSchema.safeParse(payment.referenceId);
    const recorded = registrationId.success
      ? await this.ledger.recordGatewayPayment({
          registrationId: registrationId.data,
          transactionId: payment.transactionId,
          amount: payment.amountCzk,
        })
      : null;

    if (recorded !== null) {
      this.logger.log(`Recorded card payment ${payment.transactionId} as ${recorded.id}`);
    }
  }
}
