import { Injectable } from '@nestjs/common';
import { createElement } from 'react';

import { czechDate, czk } from '@repo/schema/shared';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import type { InlineImage } from '../../../../core/emails/email.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { PaymentBlock, QR_PLATBA_CONTENT_ID } from '../../payment/payment-block.email.tsx';
import { qrPlatbaPng, registrationPaymentOf } from '../../payment/payment-instructions.helper.ts';
import { sendConfirmationJob } from '../send-confirmation.job.ts';

// The registration confirmation each guardian gets: the Camp's wording, the platform's payment details
// with the QR platba, and the Přihlášky attached.
@Injectable()
export class ConfirmationService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly organisations: OrganisationRepository,
    private readonly campEmails: CampEmailService,
    private readonly ledgers: LedgerService,
    private readonly jobs: JobQueue,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Enqueue a Registration's confirmation, one job per guardian, so each message is sent once.
   * @param registrationId Registration id
   */
  public async enqueue(registrationId: string): Promise<void> {
    const guardians = await this.registrations.listGuardians(registrationId);

    guardians.forEach((_, index) => this.jobs.enqueue(sendConfirmationJob, { registrationId, guardian: index + 1 }));
  }

  /**
   * Send one guardian a Registration's confirmation, unless the Camp switched it off.
   * @param registrationId Registration id
   * @param guardian the guardian's position, 1 or 2
   */
  public async send(registrationId: string, guardian: number): Promise<void> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const recipient = (await this.registrations.listGuardians(registrationId))[guardian - 1];

    if (recipient === undefined) {
      return;
    }

    const participants = await this.registrations.listParticipants(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const { total, paid } = await this.ledgers.balanceOf(registrationId);
    const payment = registrationPaymentOf({ registration, camp, organisation, total, paid });
    const inlineImages: InlineImage[] =
      payment.qrPlatba === null
        ? []
        : [
            {
              contentId: QR_PLATBA_CONTENT_ID,
              filename: 'qr-platba.png',
              contentType: 'image/png',
              content: await qrPlatbaPng(payment.qrPlatba),
            },
          ];

    await this.campEmails.send(camp.id, 'registration_confirmation', {
      values: {
        deti: participants.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', '),
        turnus: turnus.name,
        castka: czk(payment.amount),
        splatnost: payment.dueDate === null ? '' : czechDate(payment.dueDate),
        variabilni_symbol: registration.variableSymbol,
      },
      to: [recipient.email],
      payment: createElement(PaymentBlock, { payment }),
      attachments: participants.flatMap(({ prihlaskaFileId }) => (prihlaskaFileId === null ? [] : [prihlaskaFileId])),
      inlineImages,
    });
  }
}
