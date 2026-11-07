import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { emailChangeConfirmedJob } from './guardian-email-notice.job.ts';
import { GuardianEmailNoticeService } from './services/guardian-email-notice.service.ts';

@Injectable()
export class EmailChangeConfirmedHandler extends JobHandler<typeof emailChangeConfirmedJob> {
  public readonly job = emailChangeConfirmedJob;

  constructor(private readonly notices: GuardianEmailNoticeService) {
    super();
  }

  public async handle({ changeId }: JobPayload<typeof emailChangeConfirmedJob>): Promise<void> {
    await this.notices.sendNotice(changeId);
  }
}
