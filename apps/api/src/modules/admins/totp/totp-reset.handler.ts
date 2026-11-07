import { Injectable } from '@nestjs/common';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { OrganisationRepository } from '../../../repositories/organisations/organisation/organisation.repository.ts';
import { AdminService } from '../admin/services/admin.service.ts';
import { TotpResetEmail } from './totp-reset.email.tsx';
import { totpResetJob } from './totp-reset.job.ts';

@Injectable()
export class TotpResetHandler extends JobHandler<typeof totpResetJob> {
  public readonly job = totpResetJob;

  constructor(
    private readonly admins: AdminService,
    private readonly organisations: OrganisationRepository,
    private readonly emails: EmailService,
    private readonly unitOfWork: UnitOfWork,
  ) {
    super();
  }

  public async handle({ adminId, byOperator }: JobPayload<typeof totpResetJob>): Promise<void> {
    const admin = await this.admins.getByIdOrThrow(adminId);
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);

    await this.emails.sendForPlatform(
      TotpResetEmail,
      { organisation: organisation.displayName, byOperator },
      { to: [admin.email] },
    );
  }
}
