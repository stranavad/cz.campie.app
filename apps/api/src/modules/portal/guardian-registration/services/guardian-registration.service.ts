import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { GuardianPortal, GuardianRegistration } from '@repo/schema/portal';

import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { PaymentGatewayAccountRepository } from '../../../../repositories/organisations/payment-gateway-account/payment-gateway-account.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { campContactOf } from '../../../camps/camp/camp-contact.ts';
import { LedgerService } from '../../../registrations/ledger/services/ledger.service.ts';
import { registrationPaymentOf } from '../../../registrations/payment/payment-instructions.helper.ts';

// A guardian's Registrations in the portal. Access follows the guardian emails on each Registration at the
// time of the request, so removing an email takes access away at once.
@Injectable()
export class GuardianRegistrationService {
  private readonly technicalContact: string;

  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly ledgers: LedgerService,
    private readonly files: FileService,
    private readonly gatewayAccounts: PaymentGatewayAccountRepository,
    private readonly unitOfWork: UnitOfWork,
    config: ConfigService<Env, true>,
  ) {
    this.technicalContact = config.get('PLATFORM_OPERATOR_EMAIL', { infer: true });
  }

  /**
   * List the Registrations of the current Organisation that name a guardian, newest first, with whom to
   * write about a technical problem.
   * @param email the signed-in guardian's email
   */
  public async list(email: string): Promise<GuardianPortal> {
    const registrations = await this.registrations.listByGuardian(email);
    const card = await this.takesCards();
    const shown: GuardianRegistration[] = [];

    for (const registration of registrations) {
      shown.push(await this.show(registration, card));
    }

    return { registrations: shown, technicalContact: this.technicalContact };
  }

  /**
   * Get one Registration that names a guardian.
   * @param email the signed-in guardian's email
   * @param registrationId Registration id
   * @throws {NotFoundException} when no Registration of the Organisation with this id names the guardian
   */
  public async get(email: string, registrationId: string): Promise<GuardianRegistration> {
    const registration = await this.registrations.getByGuardian(email, registrationId);

    if (registration === null) {
      throw new NotFoundException();
    }

    return this.show(registration, await this.takesCards());
  }

  /**
   * Tell whether the current Organisation takes card payments.
   */
  private async takesCards(): Promise<boolean> {
    return (await this.gatewayAccounts.get()) !== null;
  }

  /**
   * Show a Registration as the portal does: its Participants with their Přihláška links, its price, its
   * ledger and how to pay the rest.
   * @param registration the Registration
   * @param card whether the Organisation takes card payments
   */
  private async show(registration: RegistrationEntity, card: boolean): Promise<GuardianRegistration> {
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const participants = await this.registrations.listParticipants(registration.id);
    const ledger = await this.ledgers.get(registration.id);
    const payment = registrationPaymentOf({
      registration,
      turnus,
      camp,
      organisation,
      total: ledger.total,
      paid: ledger.paid,
    });

    return {
      id: registration.id,
      variableSymbol: registration.variableSymbol,
      submittedAt: registration.submittedAt.toISOString(),
      camp: { id: camp.id, name: camp.name, ...campContactOf(camp, organisation) },
      turnus: {
        id: turnus.id,
        name: turnus.name,
        startDate: turnus.startDate,
        endDate: turnus.endDate,
        place: turnus.place,
      },
      participants: await Promise.all(
        participants.map(async (participant) => ({
          id: participant.id,
          position: participant.position,
          firstName: participant.firstName,
          lastName: participant.lastName,
          status: participant.status,
          prihlaska: participant.prihlaskaFileId === null ? null : await this.files.link(participant.prihlaskaFileId),
        })),
      ),
      priceLines: await this.registrations.listPriceLines(registration.id),
      adjustments: ledger.adjustments.map(({ amount }) => ({ amount })),
      // A payment's note is the camp's own record, not the guardian's.
      payments: ledger.payments.map(({ amount, paidOn }) => ({ amount, paidOn })),
      total: ledger.total,
      paid: ledger.paid,
      balance: ledger.balance,
      status: ledger.status,
      overdue: ledger.overdue,
      payment: {
        account: payment.account,
        card,
        phase: ledger.amountDue.phase,
        amount: payment.amount,
        dueDate: payment.dueDate,
        qrPlatba: payment.qrPlatba,
        balance: payment.balance,
      },
    };
  }
}
