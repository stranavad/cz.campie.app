import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { generatePrihlaskyJob } from './generate-prihlasky.job.ts';
import { PrihlaskaService } from './services/prihlaska.service.ts';

// A retry rolls back the PDFs stored by the failed attempt, so it starts over cleanly.
@Injectable()
export class GeneratePrihlaskyHandler extends JobHandler<typeof generatePrihlaskyJob> {
  public readonly job = generatePrihlaskyJob;

  constructor(private readonly prihlasky: PrihlaskaService) {
    super();
  }

  public async handle({ registrationId }: JobPayload<typeof generatePrihlaskyJob>): Promise<void> {
    await this.prihlasky.generateAll({ kind: 'system' }, registrationId);
  }
}
