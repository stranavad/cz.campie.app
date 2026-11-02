import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { OwnerChangedEmail } from './owner-changed.email.tsx';
import { ownerChangedJob } from './owner-changed.job.ts';
import { MembershipService } from './services/membership.service.ts';

// Emails one Owner about a change of the Organisation's Owners.
@Injectable()
export class OwnerChangedHandler extends JobHandler<typeof ownerChangedJob> {
  public readonly job = ownerChangedJob;

  constructor(
    private readonly memberships: MembershipService,
    private readonly emails: EmailService,
  ) {
    super();
  }

  public async handle(payload: JobPayload<typeof ownerChangedJob>): Promise<void> {
    const { to, props } = await this.memberships.ownerChangeNotice(payload);

    await this.emails.sendForPlatform(OwnerChangedEmail, props, { to: [to] });
  }
}
