import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { LedgerService } from '../ledger/services/ledger.service.ts';
import { sendPaymentReminderJob } from './send-payment-reminder.job.ts';

@Injectable()
export class SendPaymentReminderHandler extends JobHandler<typeof sendPaymentReminderJob> {
  public readonly job = sendPaymentReminderJob;

  constructor(private readonly ledger: LedgerService) {
    super();
  }

  public async handle({ registrationId, guardian }: JobPayload<typeof sendPaymentReminderJob>): Promise<void> {
    await this.ledger.sendPaymentReminder(registrationId, guardian);
  }
}
