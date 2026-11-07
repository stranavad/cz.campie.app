import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { registrationSubmittedJob } from './registration-submitted.job.ts';
import { RegistrationService } from './services/registration.service.ts';

// Tells the Camp's team of the new Registration.
@Injectable()
export class RegistrationSubmittedHandler extends JobHandler<typeof registrationSubmittedJob> {
  public readonly job = registrationSubmittedJob;

  constructor(private readonly registrations: RegistrationService) {
    super();
  }

  public async handle({ registrationId }: JobPayload<typeof registrationSubmittedJob>): Promise<void> {
    await this.registrations.notifyTeam(registrationId);
  }
}
