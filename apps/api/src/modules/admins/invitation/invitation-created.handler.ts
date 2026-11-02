import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../core/config/env.schema.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { invitationCreatedJob } from './invitation-created.job.ts';
import { InvitationEmail } from './invitation.email.tsx';
import { INVITATION_VALID_DAYS, InvitationService } from './services/invitation.service.ts';

// Emails the invitee the link. A retry rolls back the failed attempt's token and makes a new one; an
// invitation revoked before the job ran sends nothing.
@Injectable()
export class InvitationCreatedHandler extends JobHandler<typeof invitationCreatedJob> {
  public readonly job = invitationCreatedJob;

  constructor(
    private readonly invitations: InvitationService,
    private readonly emails: EmailService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  public async handle({ invitationId }: JobPayload<typeof invitationCreatedJob>): Promise<void> {
    const started = await this.invitations.start(invitationId);

    if (started === null) {
      return;
    }

    const scheme = this.config.get('PLATFORM_SCHEME', { infer: true });
    const domain = this.config.get('PLATFORM_DOMAIN', { infer: true });

    await this.emails.sendForPlatform(
      InvitationEmail,
      {
        organisation: started.organisation,
        link: `${scheme}://app.${domain}/pozvanka?token=${started.token}`,
        validDays: INVITATION_VALID_DAYS,
        productName: this.config.get('PRODUCT_NAME', { infer: true }),
      },
      { to: [started.email] },
    );
  }
}
