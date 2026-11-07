import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { emailChangeConfirmedJob, emailChangeRequestedJob } from './guardian-edit.jobs.ts';
import { GuardianEmailChangeService } from './services/guardian-email-change.service.ts';

@Injectable()
export class EmailChangeRequestedHandler extends JobHandler<typeof emailChangeRequestedJob> {
  public readonly job = emailChangeRequestedJob;

  constructor(private readonly changes: GuardianEmailChangeService) {
    super();
  }

  public async handle({ changeId }: JobPayload<typeof emailChangeRequestedJob>): Promise<void> {
    await this.changes.sendConfirmation(changeId);
  }
}

@Injectable()
export class EmailChangeConfirmedHandler extends JobHandler<typeof emailChangeConfirmedJob> {
  public readonly job = emailChangeConfirmedJob;

  constructor(private readonly changes: GuardianEmailChangeService) {
    super();
  }

  public async handle({ changeId }: JobPayload<typeof emailChangeConfirmedJob>): Promise<void> {
    await this.changes.sendNotice(changeId);
  }
}
