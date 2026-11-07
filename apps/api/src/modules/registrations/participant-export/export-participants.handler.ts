import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { exportParticipantsJob, removeExportJob } from './export-participants.job.ts';
import { ParticipantExportService } from './services/participant-export.service.ts';

@Injectable()
export class ExportParticipantsHandler extends JobHandler<typeof exportParticipantsJob> {
  public readonly job = exportParticipantsJob;

  constructor(private readonly exports: ParticipantExportService) {
    super();
  }

  public async handle({ exportId }: JobPayload<typeof exportParticipantsJob>): Promise<void> {
    await this.exports.build(exportId);
  }
}

@Injectable()
export class RemoveExportHandler extends JobHandler<typeof removeExportJob> {
  public readonly job = removeExportJob;

  constructor(private readonly exports: ParticipantExportService) {
    super();
  }

  public async handle({ exportId }: JobPayload<typeof removeExportJob>): Promise<void> {
    await this.exports.remove(exportId);
  }
}
