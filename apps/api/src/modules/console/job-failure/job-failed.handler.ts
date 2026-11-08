import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../core/config/env.schema.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { jobFailedJob } from '../../../core/jobs/job-failed.job.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { RateLimiter, type RateLimit } from '../../../core/rate-limits/rate-limiter.ts';
import { JobFailedEmail } from './job-failed.email.tsx';

// One alert per kind of job an hour: a renderer outage fails every PDF job, and one mail tells as much.
const ALERT_LIMIT: RateLimit = { name: 'job-failed-alert', max: 1, windowMs: 60 * 60 * 1000 };

// Emails the Platform operator that a job gave up, unless one of its kind was reported within the hour.
@Injectable()
export class JobFailedHandler extends JobHandler<typeof jobFailedJob> {
  public readonly job = jobFailedJob;
  private readonly logger = new Logger(JobFailedHandler.name);

  constructor(
    private readonly emails: EmailService,
    private readonly limiter: RateLimiter,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  public async handle(failed: JobPayload<typeof jobFailedJob>): Promise<void> {
    const attempt = await this.limiter.take(ALERT_LIMIT, failed.job);

    if (attempt === null) {
      this.logger.warn(`Job ${failed.jobId ?? '?'} (${failed.job}) failed for good; its kind was reported this hour`);

      return;
    }

    try {
      await this.emails.sendForPlatform(JobFailedEmail, failed, {
        to: [this.config.get('PLATFORM_OPERATOR_EMAIL', { infer: true })],
      });
    } catch (error) {
      // Not sent, so the retry may send it.
      await attempt.release();

      throw error;
    }
  }
}
