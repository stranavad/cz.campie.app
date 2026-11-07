import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { UndeliverableReason } from '@repo/schema/emails';
import { emailSchema } from '@repo/schema/shared';

import { AuditService } from '../../../../core/audit/audit.service.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { MailSender, type MailNotificationRequest } from '../../../../core/ports/mail-sender/mail-sender.port.ts';
import { MailStatisticsRepository } from '../../../../repositories/emails/mail-statistics/mail-statistics.repository.ts';
import { UndeliverableEmailRepository } from '../../../../repositories/emails/undeliverable-email/undeliverable-email.repository.ts';
import { OrganisationRepository } from '../../../../repositories/organisations/organisation/organisation.repository.ts';

// The mail provider's bounce and complaint notifications: each marks its addresses undeliverable in the
// Organisation the message came from, so its notifications stop going there.
@Injectable()
export class MailNotificationService {
  constructor(
    private readonly mailSender: MailSender,
    private readonly undeliverable: UndeliverableEmailRepository,
    private readonly statistics: MailStatisticsRepository,
    private readonly organisations: OrganisationRepository,
    private readonly audit: AuditService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Act on a notification once the provider's signature checks out; one of no interest is accepted as is,
   * so the provider stops repeating it.
   * @param request the notification as it arrived
   * @throws {UnauthorizedException} when the signature is missing, wrong or stale
   */
  public async receive(request: MailNotificationRequest): Promise<void> {
    const notification = this.mailSender.readNotification(request, this.clock.now());

    if (notification.kind === 'invalid') {
      throw new UnauthorizedException();
    }

    if (notification.kind === 'ignored') {
      return;
    }

    const { organisationId, reason, recipients } = notification;

    await this.unitOfWork.run(organisationId, async () => {
      // A deleted Organisation's late notification has nothing left to mark.
      if ((await this.organisations.getById(organisationId)) === null) {
        return;
      }

      const emails = new Set(
        recipients.flatMap((recipient) => {
          const email = emailSchema.safeParse(recipient);

          return email.success ? [email.data.toLowerCase()] : [];
        }),
      );

      for (const email of emails) {
        await this.mark(email, reason);
      }

      await this.statistics.add(organisationId, reason === 'bounce' ? 'bounced' : 'complained', 1);
    });
  }

  /**
   * Mark one address of the current Organisation undeliverable, audited as the system's change.
   * @param email the address, lowercase
   * @param reason why
   */
  private async mark(email: string, reason: UndeliverableReason): Promise<void> {
    const { id, before } = await this.undeliverable.mark(email, reason, this.clock.now());

    if (before?.reason === reason) {
      return;
    }

    await this.audit.record(
      { kind: 'system' },
      {
        action: 'undeliverable_email.mark',
        target: { type: 'undeliverable_email', id },
        change: { before: before === null ? null : { email, ...before }, after: { email, reason } },
      },
    );
  }
}
