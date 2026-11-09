import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { adminEmailChangeConfirmedJob, adminEmailChangeRequestedJob } from './email-change.jobs.ts';
import { EmailChangeService } from './services/email-change.service.ts';

// The token is made here, not in the request, so it never sits in Redis; a retry rolls back the failed
// attempt's token and makes a new one.
@Injectable()
export class AdminEmailChangeRequestedHandler extends JobHandler<typeof adminEmailChangeRequestedJob> {
  public readonly job = adminEmailChangeRequestedJob;

  constructor(private readonly emailChanges: EmailChangeService) {
    super();
  }

  public async handle({ changeId }: JobPayload<typeof adminEmailChangeRequestedJob>): Promise<void> {
    await this.emailChanges.sendConfirmation(changeId);
  }
}

@Injectable()
export class AdminEmailChangeConfirmedHandler extends JobHandler<typeof adminEmailChangeConfirmedJob> {
  public readonly job = adminEmailChangeConfirmedJob;

  constructor(private readonly emailChanges: EmailChangeService) {
    super();
  }

  public async handle({ changeId }: JobPayload<typeof adminEmailChangeConfirmedJob>): Promise<void> {
    await this.emailChanges.sendNotice(changeId);
  }
}
