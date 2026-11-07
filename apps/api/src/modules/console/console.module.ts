import { Module } from '@nestjs/common';

import { AdminsModule } from '../admins/admins.module.ts';
import { ConsoleOrganisationController } from './organisation/console-organisation.controller.ts';
import { ConsoleOrganisationService } from './organisation/services/console-organisation.service.ts';
import { ConsoleProblemReportController } from './problem-report/console-problem-report.controller.ts';
import { FeedbackController } from './problem-report/feedback.controller.ts';
import { ProblemReportedHandler } from './problem-report/problem-report.handler.ts';
import { PublicProblemReportController } from './problem-report/public-problem-report.controller.ts';
import { ProblemReportService } from './problem-report/services/problem-report.service.ts';

@Module({
  imports: [AdminsModule],
  controllers: [
    ConsoleOrganisationController,
    ConsoleProblemReportController,
    FeedbackController,
    PublicProblemReportController,
  ],
  providers: [ConsoleOrganisationService, ProblemReportService, ProblemReportedHandler],
})
export class ConsoleModule {}
