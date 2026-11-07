import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import type { StartPortalCardPaymentBody } from '@repo/schema/portal';
import type { CardPaymentErrorCode, CardPaymentRedirect, CardPaymentResult } from '@repo/schema/registrations';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { PaymentGateway } from '../../../../core/ports/payment-gateway/payment-gateway.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { publicLogoUrl } from '../../../../repositories/organisations/organisation/organisation.entity.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { CardPaymentRepository } from '../../../../repositories/registrations/card-payment/card-payment.repository.ts';
import { PaymentRepository } from '../../../../repositories/registrations/payment/payment.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { effectiveBranding } from '../../../camps/camp-branding/services/camp-branding.service.ts';
import { PaymentGatewayService } from '../../../organisations/payment-gateway/services/payment-gateway.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';

const registrationIdSchema = z.uuid();

// The submission's key starts a card payment only this long after it, while the guardian is still on the
// page; later, the portal does.
const SUBMITTED_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Refuse a card payment with a code the frontend translates.
 * @param code why
 */
function refused(code: CardPaymentErrorCode): ConflictException {
  return new ConflictException({ code, message: 'No card payment can be started' });
}

// Card payments through the Organisation's own Comgate account: starting one for a Registration, showing
// how one ended, and recording one Comgate reports paid. Logs ids only.
@Injectable()
export class CardPaymentService {
  private readonly logger = new Logger(CardPaymentService.name);
  private readonly notificationLimit: RequestLimit;
  private readonly paymentLimit: RequestLimit;
  private readonly resultLimit: RequestLimit;
  private readonly scheme: string;
  private readonly domain: string;

  constructor(
    private readonly gatewayAccounts: PaymentGatewayService,
    private readonly gateway: PaymentGateway,
    private readonly registrations: RegistrationRepository,
    private readonly cardPayments: CardPaymentRepository,
    private readonly payments: PaymentRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly ledger: LedgerService,
    private readonly unitOfWork: UnitOfWork,
    private readonly rateLimiter: RateLimiter,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    const limits = config.get('requestLimits', { infer: true });

    this.notificationLimit = limits.gatewayNotification;
    this.paymentLimit = limits.cardPayment;
    this.resultLimit = limits.cardPaymentResult;
    this.scheme = config.get('PLATFORM_SCHEME', { infer: true });
    this.domain = config.get('PLATFORM_DOMAIN', { infer: true });
  }

  /**
   * Start a card payment of the amount due now, straight after a submission, found by its key.
   * @param idempotencyKey the submission's key
   * @param ipAddress where the request came from
   * @throws {NotFoundException} when no Registration was submitted with the key in the last day
   */
  public async startAfterSubmission(idempotencyKey: string, ipAddress: string): Promise<CardPaymentRedirect> {
    await this.rateLimiter.admit(this.paymentLimit, { ipAddress, target: this.unitOfWork.organisationId });
    const registration = await this.registrations.getByIdempotencyKey(idempotencyKey);

    if (
      registration === null ||
      this.clock.now().getTime() - registration.submittedAt.getTime() > SUBMITTED_PAYMENT_WINDOW_MS
    ) {
      throw new NotFoundException();
    }

    return this.start(registration, (await this.ledger.balanceOf(registration.id)).amountDue.amount);
  }

  /**
   * Start a card payment of one of the guardian's Registrations: the amount due now, or all outstanding.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @param body which amount
   * @param ipAddress where the request came from
   * @throws {NotFoundException} when the guardian has no access to the Registration
   */
  public async startForGuardian(
    email: string,
    registrationId: string,
    body: StartPortalCardPaymentBody,
    ipAddress: string,
  ): Promise<CardPaymentRedirect> {
    await this.rateLimiter.admit(this.paymentLimit, { ipAddress, target: this.unitOfWork.organisationId });
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    const balance = await this.ledger.balanceOf(registration.id);

    return this.start(registration, body.amount === 'due_now' ? balance.amountDue.amount : balance.balance);
  }

  /**
   * Show how a card payment ended, with the Camp's branding and website. Comgate may send the guardian
   * back before it notifies, or its notification may be lost, so a transaction it reports paid is recorded
   * here as a notification would.
   * @param transactionId Comgate's transaction id
   * @param ipAddress where the request came from
   * @throws {NotFoundException} when no card payment of the Organisation has the transaction id
   */
  public async result(transactionId: string, ipAddress: string): Promise<CardPaymentResult> {
    await this.rateLimiter.admit(this.resultLimit, { ipAddress, target: this.unitOfWork.organisationId });
    const payment = await this.cardPayments.getByTransactionId(transactionId);

    if (payment === null) {
      throw new NotFoundException();
    }

    const registration = await this.registrations.getByIdOrThrow(payment.registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const { accentColour, logoFileId } = effectiveBranding(
      camp,
      await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId),
    );

    return {
      state: await this.stateOf(payment.registrationId, transactionId),
      campName: camp.name,
      accentColour,
      logoUrl: logoFileId === null ? null : publicLogoUrl(logoFileId),
      websiteUrl: turnus.websiteUrl ?? camp.websiteUrl,
    };
  }

  /**
   * Handle Comgate's notification of a transaction: fetch its status with the current Organisation's keys,
   * never trusting the notification, and record it once paid. A transaction the account does not know, one
   * not paid, or one of a Registration this Organisation has not is ignored. Anyone may post one, and each
   * costs a call to Comgate, so they are limited per address and Organisation.
   * @param transactionId Comgate's transaction id
   * @param ipAddress where the notification came from
   */
  public async handleNotification(transactionId: string, ipAddress: string): Promise<void> {
    // A transaction this Organisation never started is answered at once, without asking Comgate or counting
    // against the Organisation, so made-up notifications cannot use up the limit real ones need.
    if ((await this.cardPayments.getByTransactionId(transactionId)) === null) {
      await this.rateLimiter.admitAddress(this.notificationLimit, ipAddress);

      return;
    }

    await this.rateLimiter.admit(this.notificationLimit, { ipAddress, target: this.unitOfWork.organisationId });
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

  /**
   * Create a payment at Comgate with the current Organisation's account and remember it. Comgate failing
   * refuses only the card payment; bank transfer stays.
   * @param registration the Registration
   * @param amount what to pay
   * @throws {ConflictException} card_payment_nothing_due when nothing is to be paid; card_payment_unavailable
   * when the Organisation has no Comgate keys
   * @throws {ServiceUnavailableException} card_payment_unavailable when Comgate fails
   */
  private async start(registration: RegistrationEntity, amount: number): Promise<CardPaymentRedirect> {
    if (amount <= 0) {
      throw refused('card_payment_nothing_due');
    }

    const credentials = await this.gatewayAccounts.credentials();

    if (credentials === null) {
      throw refused('card_payment_unavailable');
    }

    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const [guardian] = await this.registrations.listGuardians(registration.id);
    let created;

    try {
      created = await this.gateway.createPayment({
        credentials,
        referenceId: registration.id,
        amountCzk: amount,
        label: `VS ${registration.variableSymbol}`,
        email: guardian?.email ?? '',
        returnUrl: `${this.scheme}://${organisation.subdomain}.${this.domain}/platba?id=\${id}`,
      });
    } catch (error) {
      this.logger.warn(
        `Comgate refused a card payment of Registration ${registration.id}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      const code: CardPaymentErrorCode = 'card_payment_unavailable';

      throw new ServiceUnavailableException({ code, message: 'The card gateway failed' });
    }

    await this.cardPayments.create({
      registrationId: registration.id,
      transactionId: created.transactionId,
      amount,
      createdAt: this.clock.now(),
    });

    return { redirectUrl: created.redirectUrl };
  }

  /**
   * Tell how a card payment stands: paid once recorded, or once Comgate reports it paid (then recorded),
   * failed once Comgate cancelled it, else pending.
   * @param registrationId the Registration the payment was started for
   * @param transactionId Comgate's transaction id
   */
  private async stateOf(registrationId: string, transactionId: string): Promise<CardPaymentResult['state']> {
    if (await this.payments.hasGatewayEntry(transactionId)) {
      return 'paid';
    }

    const credentials = await this.gatewayAccounts.credentials();
    const payment =
      credentials === null ? null : await this.gateway.getPayment(credentials, transactionId).catch(() => null);

    if (payment?.status === 'paid' && payment.referenceId === registrationId && payment.amountCzk > 0) {
      await this.ledger.recordGatewayPayment({ registrationId, transactionId, amount: payment.amountCzk });

      return 'paid';
    }

    return payment?.status === 'cancelled' ? 'failed' : 'pending';
  }
}
