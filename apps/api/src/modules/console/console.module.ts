import { Module } from '@nestjs/common';

import { ConsoleOrganisationController } from './organisation/console-organisation.controller.ts';
import { ConsoleOrganisationService } from './organisation/services/console-organisation.service.ts';

@Module({
  controllers: [ConsoleOrganisationController],
  providers: [ConsoleOrganisationService],
})
export class ConsoleModule {}
