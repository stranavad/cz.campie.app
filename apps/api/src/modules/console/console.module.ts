import { Module } from '@nestjs/common';

import { AdminsModule } from '../admins/admins.module.ts';
import { CampsModule } from '../camps/camps.module.ts';
import { JobFailedHandler } from './job-failure/job-failed.handler.ts';
import { OrganisationPreviewController } from './organisation-preview/organisation-preview.controller.ts';
import { ConsoleOrganisationController } from './organisation/console-organisation.controller.ts';
import { ConsoleOrganisationService } from './organisation/services/console-organisation.service.ts';
import { ConsoleProblemReportController } from './problem-report/console-problem-report.controller.ts';
import { FeedbackController } from './problem-report/feedback.controller.ts';
import { ProblemReportedHandler } from './problem-report/problem-report.handler.ts';
import { PublicProblemReportController } from './problem-report/public-problem-report.controller.ts';
import { ProblemReportService } from './problem-report/services/problem-report.service.ts';

@Module({
  imports: [AdminsModule, CampsModule],
  controllers: [
    ConsoleOrganisationController,
    OrganisationPreviewController,
    ConsoleProblemReportController,
    FeedbackController,
    PublicProblemReportController,
  ],
  providers: [ConsoleOrganisationService, ProblemReportService, ProblemReportedHandler, JobFailedHandler],
})
export class ConsoleModule {}
