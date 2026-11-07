import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendCancellationJob } from './send-cancellation.job.ts';
import { CancellationService } from './services/cancellation.service.ts';

@Injectable()
export class SendCancellationHandler extends JobHandler<typeof sendCancellationJob> {
  public readonly job = sendCancellationJob;

  constructor(private readonly cancellations: CancellationService) {
    super();
  }

  public async handle({
    registrationId,
    guardian,
    participantIds,
  }: JobPayload<typeof sendCancellationJob>): Promise<void> {
    await this.cancellations.sendNotice(registrationId, guardian, participantIds);
  }
}
