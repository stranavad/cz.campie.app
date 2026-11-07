import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { ConsentSignatureService } from './services/consent-signature.service.ts';
import { generateSignedConsentJob, sendConsentCopyJob } from './signature.jobs.ts';

@Injectable()
export class GenerateSignedConsentHandler extends JobHandler<typeof generateSignedConsentJob> {
  public readonly job = generateSignedConsentJob;

  constructor(private readonly signatures: ConsentSignatureService) {
    super();
  }

  public async handle({ signatureId }: JobPayload<typeof generateSignedConsentJob>): Promise<void> {
    await this.signatures.generatePdf(signatureId);
  }
}

@Injectable()
export class SendConsentCopyHandler extends JobHandler<typeof sendConsentCopyJob> {
  public readonly job = sendConsentCopyJob;

  constructor(private readonly signatures: ConsentSignatureService) {
    super();
  }

  public async handle({ signatureId, guardian }: JobPayload<typeof sendConsentCopyJob>): Promise<void> {
    await this.signatures.sendCopy(signatureId, guardian);
  }
}
