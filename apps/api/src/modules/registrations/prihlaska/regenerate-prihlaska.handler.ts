import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { regeneratePrihlaskaJob } from './regenerate-prihlaska.job.ts';
import { PrihlaskaService } from './services/prihlaska.service.ts';

// The admin's request is audited when made; the job runs as the system.
@Injectable()
export class RegeneratePrihlaskaHandler extends JobHandler<typeof regeneratePrihlaskaJob> {
  public readonly job = regeneratePrihlaskaJob;

  constructor(private readonly prihlasky: PrihlaskaService) {
    super();
  }

  public async handle({ participantId }: JobPayload<typeof regeneratePrihlaskaJob>): Promise<void> {
    await this.prihlasky.regenerate({ kind: 'system' }, participantId);
  }
}
