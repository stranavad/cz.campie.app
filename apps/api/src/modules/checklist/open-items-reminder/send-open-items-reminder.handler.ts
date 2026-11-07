import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendOpenItemsReminderJob } from './send-open-items-reminder.job.ts';
import { OpenItemsReminderService } from './services/open-items-reminder.service.ts';

@Injectable()
export class SendOpenItemsReminderHandler extends JobHandler<typeof sendOpenItemsReminderJob> {
  public readonly job = sendOpenItemsReminderJob;

  constructor(private readonly reminders: OpenItemsReminderService) {
    super();
  }

  public async handle({ registrationId, guardian }: JobPayload<typeof sendOpenItemsReminderJob>): Promise<void> {
    await this.reminders.sendTo(registrationId, guardian);
  }
}
