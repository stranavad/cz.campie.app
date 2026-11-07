import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { notifyTeamJob } from './notify-team.job.ts';
import { RegistrationService } from './services/registration.service.ts';

@Injectable()
export class NotifyTeamHandler extends JobHandler<typeof notifyTeamJob> {
  public readonly job = notifyTeamJob;

  constructor(private readonly registrations: RegistrationService) {
    super();
  }

  public async handle({ registrationId }: JobPayload<typeof notifyTeamJob>): Promise<void> {
    await this.registrations.notifyTeam(registrationId);
  }
}
