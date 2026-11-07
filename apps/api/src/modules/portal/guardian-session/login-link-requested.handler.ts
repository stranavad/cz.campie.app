import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { loginLinkRequestedJob } from './login-link-requested.job.ts';
import { GuardianLoginService } from './services/guardian-login.service.ts';

@Injectable()
export class LoginLinkRequestedHandler extends JobHandler<typeof loginLinkRequestedJob> {
  public readonly job = loginLinkRequestedJob;

  constructor(private readonly logins: GuardianLoginService) {
    super();
  }

  public async handle({ requestId }: JobPayload<typeof loginLinkRequestedJob>): Promise<void> {
    await this.logins.sendLink(requestId);
  }
}
