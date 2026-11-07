import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  PaymentReminderErrorCode,
  PaymentReminderPreview,
  PaymentRemindersSent,
  SendPaymentRemindersBody,
} from '@repo/schema/registrations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import type { RegistrationEntity } from '../../../../repositories/registrations/registration/registration.entity.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { LedgerService } from '../../ledger/services/ledger.service.ts';
import { sendPaymentReminderJob } from '../send-payment-reminder.job.ts';

interface Targets {
  readonly campId: string;
  readonly withBalance: readonly RegistrationEntity[];
  readonly overdue: readonly RegistrationEntity[];
}

// Reminding the guardians of a Turnus's Registrations of what they owe, in one action of an admin.
// Permission (Registrations write) is the route's.
@Injectable()
export class PaymentReminderService {
  private readonly limit: RequestLimit;

  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly ledger: LedgerService,
    private readonly campEmails: CampEmailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).paymentReminder;
  }

  /**
   * Count the Registrations of a Turnus a reminder would go to: all with a balance, and the Overdue ones.
   * @param turnusId Turnus id
   */
  public async preview(turnusId: string): Promise<PaymentReminderPreview> {
    const targets = await this.targetsOf(turnusId);

    return {
      withBalance: targets.withBalance.length,
      overdue: targets.overdue.length,
      enabled: await this.campEmails.isEnabled(targets.campId, 'payment_reminder'),
    };
  }

  /**
   * Remind both guardians of each targeted Registration, from a job per guardian, audited with how many;
   * a few times per Organisation within the window.
   * @param actor the admin
   * @param turnusId Turnus id
   * @param body all with a balance, or only the Overdue ones
   * @throws {ConflictException} payment_reminder_switched_off when the Camp sends no payment reminder
   */
  public async send(actor: Actor, turnusId: string, body: SendPaymentRemindersBody): Promise<PaymentRemindersSent> {
    const targets = await this.targetsOf(turnusId);

    if (!(await this.campEmails.isEnabled(targets.campId, 'payment_reminder'))) {
      const code: PaymentReminderErrorCode = 'payment_reminder_switched_off';

      throw new ConflictException({ code, message: 'The Camp switched its payment reminder off' });
    }

    const reminded = body.overdueOnly ? targets.overdue : targets.withBalance;

    if (reminded.length === 0) {
      return { reminded: 0 };
    }

    await this.rateLimiter.admitTarget(this.limit, this.unitOfWork.organisationId);
    const guardians = await this.registrations.listGuardiansOf(reminded.map(({ id }) => id));

    for (const registration of reminded) {
      (guardians.get(registration.id) ?? []).forEach((_, index) =>
        this.jobs.enqueue(sendPaymentReminderJob, { registrationId: registration.id, guardian: index + 1 }),
      );
    }

    await this.audit.record(actor, {
      action: 'payment_reminder.send',
      target: { type: 'turnus', id: turnusId },
      change: { before: null, after: { overdueOnly: body.overdueOnly, reminded: reminded.length } },
    });

    return { reminded: reminded.length };
  }

  /**
   * Find a Turnus's Registrations with a Registered child and a balance, and the Overdue ones among them.
   * @param turnusId Turnus id
   */
  private async targetsOf(turnusId: string): Promise<Targets> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);
    const registrations = await this.registrations.listByTurnus(turnusId);
    const participants = await this.registrations.listParticipantsOf(registrations.map(({ id }) => id));
    const active = new Set(
      participants.filter(({ status }) => status === 'registered').map(({ registrationId }) => registrationId),
    );
    const balances = await this.ledger.balancesOf(turnus, registrations);
    const withBalance = registrations.filter(({ id }) => active.has(id) && (balances.get(id)?.balance ?? 0) > 0);

    return {
      campId: turnus.campId,
      withBalance,
      overdue: withBalance.filter(({ id }) => balances.get(id)?.overdue === true),
    };
  }
}
