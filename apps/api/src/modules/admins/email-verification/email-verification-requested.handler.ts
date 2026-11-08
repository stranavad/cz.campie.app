import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../core/config/env.schema.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { emailVerificationRequestedJob } from './email-verification-requested.job.ts';
import { EmailVerificationEmail } from './email-verification.email.tsx';
import { EMAIL_VERIFICATION_VALID_DAYS, EmailVerificationService } from './services/email-verification.service.ts';

// Emails the admin a verification link. The token is made here, not in the request, so it never sits in
// Redis; a retry rolls back the failed attempt's token and makes a new one.
@Injectable()
export class EmailVerificationRequestedHandler extends JobHandler<typeof emailVerificationRequestedJob> {
  public readonly job = emailVerificationRequestedJob;

  constructor(
    private readonly emailVerifications: EmailVerificationService,
    private readonly emails: EmailService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  public async handle({ adminId }: JobPayload<typeof emailVerificationRequestedJob>): Promise<void> {
    const started = await this.emailVerifications.start(adminId);

    if (started === null) {
      return;
    }

    const scheme = this.config.get('PLATFORM_SCHEME', { infer: true });
    const domain = this.config.get('PLATFORM_DOMAIN', { infer: true });

    await this.emails.sendForPlatform(
      EmailVerificationEmail,
      {
        link: `${scheme}://app.${domain}/overeni-emailu?token=${started.token}`,
        validDays: EMAIL_VERIFICATION_VALID_DAYS,
        productName: this.config.get('PRODUCT_NAME', { infer: true }),
      },
      { to: [started.admin.email] },
    );
  }
}
