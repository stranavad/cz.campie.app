import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createElement } from 'react';

import {
  isOpenForGuardians,
  type OpenItemsReminderErrorCode,
  type OpenItemsReminderPreview,
  type OpenItemsRemindersSent,
} from '@repo/schema/checklist';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { ChecklistService, type ParticipantChecklist } from '../../checklist/services/checklist.service.ts';
import { OpenItemsBlock } from '../open-items.email.tsx';
import { sendOpenItemsReminderJob } from '../send-open-items-reminder.job.ts';

/**
 * Find the Registrations with a child that has something open for the guardians.
 * @param checklists the Turnus's checklists
 */
function openRegistrationsOf(checklists: readonly ParticipantChecklist[]): string[] {
  return [
    ...new Set(
      checklists.filter(({ items }) => items.some(isOpenForGuardians)).map(({ registrationId }) => registrationId),
    ),
  ];
}

// Reminding guardians of what is still open for their children, other than money, in one action of an
// admin. Permission (Registrations write) is the route's.
@Injectable()
export class OpenItemsReminderService {
  private readonly limit: RequestLimit;

  constructor(
    private readonly checklists: ChecklistService,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly campEmails: CampEmailService,
    private readonly audit: AuditService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).openItemsReminder;
  }

  /**
   * Count the Registrations of a Turnus with something open other than payment.
   * @param turnusId Turnus id
   */
  public async preview(turnusId: string): Promise<OpenItemsReminderPreview> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);

    return {
      registrations: openRegistrationsOf(await this.checklists.ofTurnus(turnus.id)).length,
      enabled: await this.campEmails.isEnabled(turnus.campId, 'open_items_reminder'),
    };
  }

  /**
   * Remind both guardians of each such Registration, from a job per guardian, audited with how many.
   * @param actor the admin
   * @param turnusId Turnus id
   * @throws {ConflictException} open_items_reminder_switched_off when the Camp sends no such reminder
   */
  public async send(actor: Actor, turnusId: string): Promise<OpenItemsRemindersSent> {
    const turnus = await this.turnusy.getByIdOrThrow(turnusId);

    if (!(await this.campEmails.isEnabled(turnus.campId, 'open_items_reminder'))) {
      const code: OpenItemsReminderErrorCode = 'open_items_reminder_switched_off';

      throw new ConflictException({ code, message: 'The Camp switched its open-items reminder off' });
    }

    const reminded = openRegistrationsOf(await this.checklists.ofTurnus(turnus.id));

    if (reminded.length === 0) {
      return { reminded: 0 };
    }

    await this.rateLimiter.admitTarget(this.limit, this.unitOfWork.organisationId);
    const guardians = await this.registrations.listGuardiansOf(reminded);

    for (const registrationId of reminded) {
      (guardians.get(registrationId) ?? []).forEach((_, index) =>
        this.jobs.enqueue(sendOpenItemsReminderJob, { registrationId, guardian: index + 1 }),
      );
    }

    await this.audit.record(actor, {
      action: 'open_items_reminder.send',
      target: { type: 'turnus', id: turnus.id },
      change: { before: null, after: { reminded: reminded.length } },
    });

    return { reminded: reminded.length };
  }

  /**
   * Email one guardian what is open per child as it stands now, unless nothing is or the Camp switched the
   * reminder off.
   * @param registrationId Registration id
   * @param guardian the guardian's position, 1 or 2
   */
  public async sendTo(registrationId: string, guardian: number): Promise<void> {
    const recipient = (await this.registrations.listGuardians(registrationId))[guardian - 1];
    const open = (await this.checklists.ofRegistration(registrationId)).flatMap(({ firstName, lastName, items }) => {
      const openItems = items.filter(isOpenForGuardians);

      return openItems.length === 0 ? [] : [{ name: `${firstName} ${lastName}`, items: openItems }];
    });

    if (recipient === undefined || open.length === 0) {
      return;
    }

    const registration = await this.registrations.getByIdOrThrow(registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);

    await this.campEmails.send(turnus.campId, 'open_items_reminder', {
      values: { deti: open.map(({ name }) => name).join(', '), turnus: turnus.name },
      to: [recipient.email],
      details: createElement(OpenItemsBlock, { participants: open }),
    });
  }
}
