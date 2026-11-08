import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { AdminService } from '../admin/services/admin.service.ts';
import { RecoveryCodesRegeneratedEmail } from './recovery-codes-regenerated.email.tsx';
import { recoveryCodesRegeneratedJob } from './recovery-codes-regenerated.job.ts';

@Injectable()
export class RecoveryCodesRegeneratedHandler extends JobHandler<typeof recoveryCodesRegeneratedJob> {
  public readonly job = recoveryCodesRegeneratedJob;

  constructor(
    private readonly admins: AdminService,
    private readonly emails: EmailService,
  ) {
    super();
  }

  public async handle({ adminId }: JobPayload<typeof recoveryCodesRegeneratedJob>): Promise<void> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    await this.emails.sendForPlatform(RecoveryCodesRegeneratedEmail, {}, { to: [admin.email] });
  }
}
