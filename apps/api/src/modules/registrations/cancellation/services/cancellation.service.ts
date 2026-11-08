import { Injectable, NotFoundException } from '@nestjs/common';
import { createElement } from 'react';

import type { RegistrationDetail } from '@repo/schema/registrations';

import type { AdminAccess } from '../../../../core/access/admin-access.ts';
import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { BalanceBlock } from '../../payment/balance-block.email.tsx';
import { RegistrationDetailService } from '../../registration-detail/services/registration-detail.service.ts';
import { sendCancellationJob } from '../send-cancellation.job.ts';

// Cancelling frees a child's place and changes no money: the record, its price lines and the ledger stay,
// and the admin settles storno fees and refunds by hand. Only an admin cancels. Permission (Registrations
// write) is the route's.
@Injectable()
export class CancellationService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly ledgers: LedgerService,
    private readonly campEmails: CampEmailService,
    private readonly details: RegistrationDetailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
  ) {}

  /**
   * Cancel a Participant, audited, and tell the guardians once this commits.
   * @param admin the admin
   * @param registrationId Registration id
   * @param participantId Participant id
   * @throws {NotFoundException} when the Registration has no such Participant
   */
  public async cancelParticipant(
    admin: AdminAccess,
    registrationId: string,
    participantId: string,
  ): Promise<RegistrationDetail> {
    await this.registrations.lockByIdOrThrow(registrationId);
    const participant = (await this.registrations.listParticipants(registrationId)).find(
      ({ id }) => id === participantId,
    );

    if (participant === undefined) {
      throw new NotFoundException();
    }

    await this.cancel(admin.actor, registrationId, participant.status === 'registered' ? [participantId] : []);

    return this.details.get(registrationId, admin);
  }

  /**
   * Cancel every Registered Participant of a Registration, audited, and tell the guardians once this commits.
   * @param admin the admin
   * @param registrationId Registration id
   */
  public async cancelAll(admin: AdminAccess, registrationId: string): Promise<RegistrationDetail> {
    await this.registrations.lockByIdOrThrow(registrationId);
    const registered = (await this.registrations.listParticipants(registrationId)).filter(
      ({ status }) => status === 'registered',
    );

    await this.cancel(
      admin.actor,
      registrationId,
      registered.map(({ id }) => id),
    );

    return this.details.get(registrationId, admin);
  }

  /**
   * Tell one guardian which children's places were cancelled and the balance now, unless the Camp switched
   * the email off.
   * @param registrationId Registration id
   * @param guardian the guardian's position, 1 or 2
   * @param participantIds the cancelled Participants
   */
  public async sendNotice(registrationId: string, guardian: number, participantIds: readonly string[]): Promise<void> {
    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const recipient = (await this.registrations.listGuardians(registrationId))[guardian - 1];

    if (recipient === undefined) {
      return;
    }

    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const cancelled = (await this.registrations.listParticipants(registrationId)).filter(({ id }) =>
      participantIds.includes(id),
    );
    const { balance } = await this.ledgers.balanceOf(registrationId);

    await this.campEmails.send(turnus.campId, 'cancellation', {
      values: {
        deti: cancelled.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', '),
        turnus: turnus.name,
      },
      to: [recipient.email],
      payment: createElement(BalanceBlock, { balance }),
    });
  }

  /**
   * Cancel Participants, audit each, and enqueue a notice per guardian.
   * @param actor the admin
   * @param registrationId Registration id
   * @param participantIds the Participants still Registered to cancel
   */
  private async cancel(actor: Actor, registrationId: string, participantIds: readonly string[]): Promise<void> {
    if (participantIds.length === 0) {
      return;
    }

    await this.registrations.cancelParticipants(participantIds);

    for (const participantId of participantIds) {
      await this.audit.record(actor, {
        action: 'participant.cancel',
        target: { type: 'participant', id: participantId },
        change: { before: { status: 'registered' }, after: { status: 'cancelled' } },
      });
    }

    const guardians = await this.registrations.listGuardians(registrationId);

    guardians.forEach((_, index) =>
      this.jobs.enqueue(sendCancellationJob, {
        registrationId,
        guardian: index + 1,
        participantIds: [...participantIds],
      }),
    );
  }
}
