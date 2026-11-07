import { Controller, Ip } from '@nestjs/common';

import { reportProblemEndpoint, type ReportProblemBody } from '@repo/schema/console';

import { Access } from '../../../core/access/access.decorator.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { ProblemReportService } from './services/problem-report.service.ts';

@Access('public')
@Controller()
export class PublicProblemReportController {
  constructor(private readonly reports: ProblemReportService) {}

  @Endpoint(reportProblemEndpoint)
  public report(@EndpointBody(reportProblemEndpoint) body: ReportProblemBody, @Ip() ipAddress: string): Promise<void> {
    return this.reports.reportProblem(body, ipAddress);
  }
}
