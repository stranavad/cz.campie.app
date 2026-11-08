import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { ConfirmationService } from '../confirmation/services/confirmation.service.ts';
import { generatePrihlaskyJob } from './generate-prihlasky.job.ts';
import { PrihlaskaService } from './services/prihlaska.service.ts';

// A retry rolls back the PDFs stored by the failed attempt, so it starts over cleanly; a run after one that
// succeeded finds every PDF and sends nothing again. The confirmations, which carry the PDFs, go out once
// they are stored.
@Injectable()
export class GeneratePrihlaskyHandler extends JobHandler<typeof generatePrihlaskyJob> {
  public readonly job = generatePrihlaskyJob;

  constructor(
    private readonly prihlasky: PrihlaskaService,
    private readonly confirmations: ConfirmationService,
  ) {
    super();
  }

  public async handle({ registrationId, sendConfirmation }: JobPayload<typeof generatePrihlaskyJob>): Promise<void> {
    if ((await this.prihlasky.generateMissing({ kind: 'system' }, registrationId)) && sendConfirmation) {
      await this.confirmations.enqueue(registrationId);
    }
  }
}
