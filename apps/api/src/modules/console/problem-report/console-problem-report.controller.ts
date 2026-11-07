import { Controller } from '@nestjs/common';

import {
  listProblemReportsEndpoint,
  resolveProblemReportEndpoint,
  type ProblemReport,
  type ProblemReportParams,
} from '@repo/schema/console';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointParams } from '../../../core/http/endpoint.decorator.ts';
import { ProblemReportService } from './services/problem-report.service.ts';

@Access('operator')
@Controller()
export class ConsoleProblemReportController {
  constructor(private readonly reports: ProblemReportService) {}

  @Endpoint(listProblemReportsEndpoint)
  public list(): Promise<ProblemReport[]> {
    return this.reports.list();
  }

  @Endpoint(resolveProblemReportEndpoint)
  public resolve(
    @EndpointParams(resolveProblemReportEndpoint) { reportId }: ProblemReportParams,
  ): Promise<ProblemReport> {
    return this.reports.resolve(reportId);
  }
}
