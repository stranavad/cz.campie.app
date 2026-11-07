import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendConfirmationJob } from './send-confirmation.job.ts';
import { ConfirmationService } from './services/confirmation.service.ts';

@Injectable()
export class SendConfirmationHandler extends JobHandler<typeof sendConfirmationJob> {
  public readonly job = sendConfirmationJob;

  constructor(private readonly confirmations: ConfirmationService) {
    super();
  }

  public async handle({ registrationId, guardian }: JobPayload<typeof sendConfirmationJob>): Promise<void> {
    await this.confirmations.send(registrationId, guardian);
  }
}
