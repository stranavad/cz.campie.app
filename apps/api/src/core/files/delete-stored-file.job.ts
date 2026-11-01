import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { UnitOfWork } from '../database/unit-of-work.ts';
import { defineJob, JobHandler, type JobPayload } from '../jobs/job.ts';
import { FileStorage } from '../ports/file-storage/file-storage.port.ts';
import { objectKey } from './object-key.ts';

// Runs once the record's deletion commits, so a rolled-back deletion keeps its file, and retries while
// storage is down, so no deleted file lingers.
export const deleteStoredFileJob = defineJob({
  name: 'files.delete-stored',
  scope: 'organisation',
  payload: z.object({ fileId: z.uuid() }),
});

@Injectable()
export class DeleteStoredFileHandler extends JobHandler<typeof deleteStoredFileJob> {
  public readonly job = deleteStoredFileJob;

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: FileStorage,
  ) {
    super();
  }

  public async handle({ fileId }: JobPayload<typeof deleteStoredFileJob>): Promise<void> {
    await this.storage.delete(objectKey(this.unitOfWork.organisationId, fileId));
  }
}
