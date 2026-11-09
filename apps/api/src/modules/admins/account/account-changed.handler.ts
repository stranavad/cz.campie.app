import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { AdminService } from '../admin/services/admin.service.ts';
import { AccountChangedEmail } from './account-changed.email.tsx';
import { accountChangedJob } from './account-changed.job.ts';

@Injectable()
export class AccountChangedHandler extends JobHandler<typeof accountChangedJob> {
  public readonly job = accountChangedJob;

  constructor(
    private readonly admins: AdminService,
    private readonly emails: EmailService,
  ) {
    super();
  }

  public async handle({ adminId, change }: JobPayload<typeof accountChangedJob>): Promise<void> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    await this.emails.sendForPlatform(AccountChangedEmail, { change }, { to: [admin.email] });
  }
}
