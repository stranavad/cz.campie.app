import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../core/config/env.schema.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { passwordResetRequestedJob } from './password-reset-requested.job.ts';
import { PasswordResetEmail } from './password-reset.email.tsx';
import { PASSWORD_RESET_VALID_MINUTES, PasswordResetService } from './services/password-reset.service.ts';

// Emails the admin a reset link. The token is made here, not in the request, so it never sits in Redis;
// a retry rolls back the failed attempt's token and makes a new one.
@Injectable()
export class PasswordResetRequestedHandler extends JobHandler<typeof passwordResetRequestedJob> {
  public readonly job = passwordResetRequestedJob;

  constructor(
    private readonly passwordResets: PasswordResetService,
    private readonly emails: EmailService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  public async handle({ adminId }: JobPayload<typeof passwordResetRequestedJob>): Promise<void> {
    const { admin, token } = await this.passwordResets.start(adminId);
    const scheme = this.config.get('PLATFORM_SCHEME', { infer: true });
    const domain = this.config.get('PLATFORM_DOMAIN', { infer: true });
    const link = `${scheme}://app.${domain}/nove-heslo?token=${token}`;

    await this.emails.sendForPlatform(
      PasswordResetEmail,
      {
        link,
        validMinutes: PASSWORD_RESET_VALID_MINUTES,
        productName: this.config.get('PRODUCT_NAME', { infer: true }),
      },
      { to: [admin.email] },
    );
  }
}
