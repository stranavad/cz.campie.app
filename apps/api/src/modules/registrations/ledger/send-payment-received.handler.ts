import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendPaymentReceivedJob } from './send-payment-received.job.ts';
import { LedgerService } from './services/ledger.service.ts';

@Injectable()
export class SendPaymentReceivedHandler extends JobHandler<typeof sendPaymentReceivedJob> {
  public readonly job = sendPaymentReceivedJob;

  constructor(private readonly ledgers: LedgerService) {
    super();
  }

  public async handle({ paymentId, guardian }: JobPayload<typeof sendPaymentReceivedJob>): Promise<void> {
    await this.ledgers.sendPaymentReceived(paymentId, guardian);
  }
}
