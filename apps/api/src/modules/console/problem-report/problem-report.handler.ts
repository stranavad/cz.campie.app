import { Injectable } from '@nestjs/common';

import { JobHandler, type JobPayload } from '../../../core/jobs/job.ts';
import { problemReportedJob } from './problem-report.job.ts';
import { ProblemReportService } from './services/problem-report.service.ts';

@Injectable()
export class ProblemReportedHandler extends JobHandler<typeof problemReportedJob> {
  public readonly job = problemReportedJob;

  constructor(private readonly reports: ProblemReportService) {
    super();
  }

  public async handle({ reportId }: JobPayload<typeof problemReportedJob>): Promise<void> {
    await this.reports.notify(reportId);
  }
}
