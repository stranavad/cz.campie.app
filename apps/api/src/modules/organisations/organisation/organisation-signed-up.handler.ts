import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../core/config/env.schema.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { OrganisationSignedUpEmail } from './organisation-signed-up.email.tsx';
import { organisationSignedUpJob } from './organisation-signed-up.job.ts';
import { OrganisationService } from './services/organisation.service.ts';

// Tells the Platform operator a new Organisation waits for review.
@Injectable()
export class OrganisationSignedUpHandler extends JobHandler<typeof organisationSignedUpJob> {
  public readonly job = organisationSignedUpJob;

  constructor(
    private readonly organisations: OrganisationService,
    private readonly emails: EmailService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  public async handle({ organisationId }: JobPayload<typeof organisationSignedUpJob>): Promise<void> {
    const organisation = await this.organisations.getByIdOrThrow(organisationId);
    const address = `${organisation.subdomain}.${this.config.get('PLATFORM_DOMAIN', { infer: true })}`;

    await this.emails.sendForPlatform(
      OrganisationSignedUpEmail,
      { organisation, address },
      { to: [this.config.get('PLATFORM_OPERATOR_EMAIL', { infer: true })] },
    );
  }
}
