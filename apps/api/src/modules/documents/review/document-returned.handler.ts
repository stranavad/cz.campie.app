import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { sendDocumentReturnedJob } from './document-returned.job.ts';
import { DocumentReviewService } from './services/document-review.service.ts';

@Injectable()
export class SendDocumentReturnedHandler extends JobHandler<typeof sendDocumentReturnedJob> {
  public readonly job = sendDocumentReturnedJob;

  constructor(private readonly reviews: DocumentReviewService) {
    super();
  }

  public async handle({ uploadId, guardian }: JobPayload<typeof sendDocumentReturnedJob>): Promise<void> {
    await this.reviews.sendReturned(uploadId, guardian);
  }
}
