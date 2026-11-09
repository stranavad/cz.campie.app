import { ConflictException, Injectable } from '@nestjs/common';
import { createElement } from 'react';

import { balanceOf, type Balance } from '@repo/schema/pricing';
import type {
  AddPriceAdjustmentBody,
  ErasureErrorCode,
  Ledger,
  PriceAdjustmentErrorCode,
  RecordPaymentBody,
  RecordPaymentErrorCode,
  RegistrationPayment,
} from '@repo/schema/registrations';
import { czechDate, czk, pragueDateOf } from '@repo/schema/shared';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import type { InlineImage } from '../../../../core/emails/email.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import type { TurnusEntity } from '../../../../repositories/camps/turnus/turnus.entity.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { PaymentGatewayAccountRepository } from '../../../../repositories/organisations/payment-gateway-account/payment-gateway-account.repository.ts';
import type { PaymentEntity } from '../../../../repositories/registrations/payment/payment.entity.ts';
import { PaymentRepository } from '../../../../repositories/registrations/payment/payment.repository.ts';
import type { PriceAdjustmentEntity } from '../../../../repositories/registrations/price-adjustment/price-adjustment.entity.ts';
import { PriceAdjustmentRepository } from '../../../../repositories/registrations/price-adjustment/price-adjustment.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { PaymentBlock, QR_PLATBA_CONTENT_ID } from '../../payment/payment-block.email.tsx';
import { qrPlatbaPng, registrationPaymentOf } from '../../payment/payment-instructions.helper.ts';
import { sendPaymentReceivedJob } from '../send-payment-received.job.ts';

// A Registration's money as the ledger, the Price adjustments and the frozen lines give it.
interface Books {
  readonly registration: RegistrationEntity;
  readonly turnus: TurnusEntity;
  readonly payments: readonly PaymentEntity[];
  readonly adjustments: readonly PriceAdjustmentEntity[];
  readonly balance: Balance;
}

// The money of a Registration: its append-only ledger of payments and Correcting payments, its Price
// adjustments, and what they come to. Permission (Registrations) is the route's.
@Injectable()
export class LedgerService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly payments: PaymentRepository,
    private readonly adjustments: PriceAdjustmentRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly gatewayAccounts: PaymentGatewayAccountRepository,
    private readonly campEmails: CampEmailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Get a Registration's ledger, Price adjustments and balance now.
   * @param registrationId Registration id
   */
  public async get(registrationId: string): Promise<Ledger> {
    return ledgerOf(await this.booksOf(registrationId));
  }

  /**
   * Derive a Registration's total, payments and amount due today.
   * @param registrationId Registration id
   */
  public async balanceOf(registrationId: string): Promise<Balance> {
    return (await this.booksOf(registrationId)).balance;
  }

  /**
   * Tell a guardian how to pay a Registration now, the one way the portal, the submitted page and a card
   * payment that did not go through show it: the amount due now with its date and QR platba, the rest after
   * the Deposits, and whether a card may pay.
   * @param registrationId Registration id
   */
  public async paymentInstructionsOf(registrationId: string): Promise<RegistrationPayment> {
    const books = await this.booksOf(registrationId);
    const camp = await this.camps.getByIdOrThrow(books.turnus.campId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const instructions = registrationPaymentOf({
      registration: books.registration,
      camp,
      organisation,
      total: books.balance.total,
      paid: books.balance.paid,
    });

    return {
      account: instructions.account,
      card: (await this.gatewayAccounts.get()) !== null,
      phase: books.balance.amountDue.phase,
      amount: instructions.amount,
      dueDate: instructions.dueDate,
      qrPlatba: instructions.qrPlatba,
      balance: instructions.balance,
    };
  }

  /**
   * Record a payment received, or a Correcting payment taking an amount back, audited. A payment received
   * is emailed to both guardians. The Registration stays locked meanwhile, so two corrections never take
   * back the same money.
   * @param actor who records it
   * @param registrationId Registration id
   * @param body the kind, amount, date and note
   * @throws {ConflictException} correction_exceeds_paid when a correction takes back more than was paid
   */
  public async recordPayment(actor: Actor, registrationId: string, body: RecordPaymentBody): Promise<Ledger> {
    await this.registrations.lockByIdOrThrow(registrationId);

    if (body.kind === 'correction' && body.amount > (await this.balanceOf(registrationId)).paid) {
      const code: RecordPaymentErrorCode = 'correction_exceeds_paid';

      throw new ConflictException({ code, message: 'A correction takes back at most what was paid' });
    }

    const payment = await this.payments.create({
      registrationId,
      source: body.kind === 'correction' ? 'correction' : 'manual',
      amount: body.kind === 'correction' ? -body.amount : body.amount,
      paidOn: body.paidOn,
      note: body.note,
      recordedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'payment.create',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: payment },
    });

    if (payment.source !== 'correction') {
      await this.announce(payment);
    }

    return this.get(registrationId);
  }

  /**
   * Record a card payment the gateway confirmed, once per gateway transaction, audited as the system's and
   * emailed to both guardians.
   * @param input the Registration, the gateway's transaction id and the amount it reports
   * @returns the new entry, or null when the Registration is not the current Organisation's or the
   * transaction was recorded before
   */
  public async recordGatewayPayment(input: {
    registrationId: string;
    transactionId: string;
    amount: number;
  }): Promise<PaymentEntity | null> {
    if ((await this.registrations.lockById(input.registrationId)) === null) {
      return null;
    }

    const now = this.clock.now();
    const payment = await this.payments.createGatewayEntry({
      registrationId: input.registrationId,
      gatewayTransactionId: input.transactionId,
      amount: input.amount,
      paidOn: pragueDateOf(now),
      note: 'Platba kartou',
      recordedAt: now,
    });

    if (payment === null) {
      return null;
    }

    await this.audit.record(
      { kind: 'system' },
      {
        action: 'payment.create',
        target: { type: 'registration', id: input.registrationId },
        change: { before: null, after: payment },
      },
    );
    await this.announce(payment);

    return payment;
  }

  /**
   * Add a Price adjustment, audited, under the Registration's lock, so two never take the total below zero
   * together.
   * @param actor who adds it
   * @param registrationId Registration id
   * @param body the amount, plus or minus, and the note
   * @throws {ConflictException} price_adjustment_below_zero when it would take the total below zero;
   * registration_erased when the Registration was erased, whose notes are gone for good
   */
  public async addPriceAdjustment(actor: Actor, registrationId: string, body: AddPriceAdjustmentBody): Promise<Ledger> {
    if ((await this.registrations.lockByIdOrThrow(registrationId)).erasedAt !== null) {
      const code: ErasureErrorCode = 'registration_erased';

      throw new ConflictException({ code, message: 'The Registration was erased' });
    }

    if ((await this.balanceOf(registrationId)).total + body.amount < 0) {
      const code: PriceAdjustmentErrorCode = 'price_adjustment_below_zero';

      throw new ConflictException({ code, message: 'The adjustment would take the total below zero' });
    }

    const adjustment = await this.adjustments.create({ registrationId, ...body, createdAt: this.clock.now() });

    await this.audit.record(actor, {
      action: 'price_adjustment.create',
      target: { type: 'registration', id: registrationId },
      change: { before: null, after: adjustment },
    });

    return this.get(registrationId);
  }

  /**
   * Email a payment received to each guardian of its Registration, from jobs.
   * @param payment the ledger entry
   */
  private async announce(payment: PaymentEntity): Promise<void> {
    const guardians = await this.registrations.listGuardians(payment.registrationId);

    guardians.forEach((_, index) =>
      this.jobs.enqueue(sendPaymentReceivedJob, { paymentId: payment.id, guardian: index + 1 }),
    );
  }

  /**
   * Tell one guardian a payment was received, with what is left to pay, unless the Camp switched it off.
   * @param paymentId the ledger entry
   * @param guardian the guardian's position, 1 or 2
   */
  public async sendPaymentReceived(paymentId: string, guardian: number): Promise<void> {
    const payment = await this.payments.getById(paymentId);

    if (payment !== null) {
      await this.sendPaymentEmail('payment_received', payment.registrationId, guardian, payment.amount);
    }
  }

  /**
   * Remind one guardian of what is due now, unless it was paid meanwhile or the Camp switched it off.
   * @param registrationId Registration id
   * @param guardian the guardian's position, 1 or 2
   */
  public async sendPaymentReminder(registrationId: string, guardian: number): Promise<void> {
    await this.sendPaymentEmail('payment_reminder', registrationId, guardian, null);
  }

  /**
   * Derive the balance now of each of the given Registrations, in a few queries.
   * @param registrations the Registrations
   * @returns the balance by Registration id
   */
  public async balancesOf(registrations: readonly RegistrationEntity[]): Promise<Map<string, Balance>> {
    const ids = registrations.map(({ id }) => id);
    const lines = await this.registrations.sumPriceLinesOf(ids);
    const paid = await this.payments.sumOf(ids);
    const adjusted = await this.adjustments.sumOf(ids);
    const today = pragueDateOf(this.clock.now());

    return new Map(
      registrations.map((registration) => [
        registration.id,
        balanceOf(
          {
            lines: [{ amount: lines.get(registration.id) ?? 0 }],
            adjustments: [{ amount: adjusted.get(registration.id) ?? 0 }],
            payments: [{ amount: paid.get(registration.id) ?? 0 }],
            depositTotal: registration.depositTotal,
            depositDueDate: registration.depositDueDate,
            balanceDueDate: registration.balanceDueDate,
          },
          today,
        ),
      ]),
    );
  }

  /**
   * Email one guardian of a Registration about its money, with the payment block of what is left to pay.
   * @param type payment received or the reminder
   * @param registrationId Registration id
   * @param guardian the guardian's position, 1 or 2
   * @param amount the amount the email names; null for what is due now, and then nothing is sent once
   * nothing is
   */
  private async sendPaymentEmail(
    type: 'payment_received' | 'payment_reminder',
    registrationId: string,
    guardian: number,
    amount: number | null,
  ): Promise<void> {
    const recipient = (await this.registrations.listGuardians(registrationId))[guardian - 1];

    if (recipient === undefined) {
      return;
    }

    const books = await this.booksOf(registrationId);
    // A reminder names only the children still going, and none goes once all are cancelled.
    const participants = (await this.registrations.listParticipants(registrationId)).filter(
      ({ status }) => type === 'payment_received' || status === 'registered',
    );
    const camp = await this.camps.getByIdOrThrow(books.turnus.campId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const instructions = registrationPaymentOf({
      registration: books.registration,
      camp,
      organisation,
      total: books.balance.total,
      paid: books.balance.paid,
    });

    if (amount === null && (instructions.amount === 0 || participants.length === 0)) {
      return;
    }

    const inlineImages: InlineImage[] =
      instructions.qrPlatba === null
        ? []
        : [
            {
              contentId: QR_PLATBA_CONTENT_ID,
              filename: 'qr-platba.png',
              contentType: 'image/png',
              content: await qrPlatbaPng(instructions.qrPlatba),
            },
          ];

    await this.campEmails.send(camp.id, type, {
      values: {
        deti: participants.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', '),
        turnus: books.turnus.name,
        castka: czk(amount ?? instructions.amount),
        splatnost: instructions.dueDate === null || instructions.amount === 0 ? '' : czechDate(instructions.dueDate),
        variabilni_symbol: books.registration.variableSymbol,
      },
      to: [recipient.email],
      // What is left to pay, while anything is.
      ...(instructions.amount === 0 ? {} : { payment: createElement(PaymentBlock, { payment: instructions }) }),
      inlineImages,
    });
  }

  /**
   * Load a Registration's lines, adjustments and ledger and derive its balance today in Prague, by its own
   * due dates.
   * @param registrationId Registration id
   */
  private async booksOf(registrationId: string): Promise<Books> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const lines = await this.registrations.listPriceLines(registrationId);
    const payments = await this.payments.listByRegistration(registrationId);
    const adjustments = await this.adjustments.listByRegistration(registrationId);
    const balance = balanceOf(
      {
        lines,
        adjustments,
        payments,
        depositTotal: registration.depositTotal,
        depositDueDate: registration.depositDueDate,
        balanceDueDate: registration.balanceDueDate,
      },
      pragueDateOf(this.clock.now()),
    );

    return { registration, turnus, payments, adjustments, balance };
  }
}

/**
 * Show a Registration's books as its ledger.
 * @param books the books
 */
function ledgerOf({ payments, adjustments, balance }: Books): Ledger {
  return {
    payments: payments.map((payment) => payment.toDto()),
    adjustments: adjustments.map((adjustment) => adjustment.toDto()),
    ...balance,
  };
}
