import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendTestCampEmailJob } from './send-test-email.job.ts';
import { CampEmailService } from './services/camp-email.service.ts';

@Injectable()
export class SendTestCampEmailHandler extends JobHandler<typeof sendTestCampEmailJob> {
  public readonly job = sendTestCampEmailJob;

  constructor(private readonly campEmails: CampEmailService) {
    super();
  }

  public async handle({ adminId, campId, type, sealedDraft }: JobPayload<typeof sendTestCampEmailJob>): Promise<void> {
    await this.campEmails.sendTest(adminId, campId, type, sealedDraft);
  }
}
