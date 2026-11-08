import { Injectable } from '@nestjs/common';

import { JobHandler } from '../../core/jobs/job.ts';
import { housekeepingJob, organisationHousekeepingJob } from './housekeeping.jobs.ts';
import { HousekeepingService } from './services/housekeeping.service.ts';

@Injectable()
export class HousekeepingHandler extends JobHandler<typeof housekeepingJob> {
  public readonly job = housekeepingJob;

  constructor(private readonly housekeeping: HousekeepingService) {
    super();
  }

  public async handle(): Promise<void> {
    await this.housekeeping.tidyPlatform();
  }
}

@Injectable()
export class OrganisationHousekeepingHandler extends JobHandler<typeof organisationHousekeepingJob> {
  public readonly job = organisationHousekeepingJob;

  constructor(private readonly housekeeping: HousekeepingService) {
    super();
  }

  public async handle(): Promise<void> {
    await this.housekeeping.tidyOrganisation();
  }
}
