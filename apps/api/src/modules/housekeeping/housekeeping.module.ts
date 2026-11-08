import { Module } from '@nestjs/common';

import { RegistrationsModule } from '../registrations/registrations.module.ts';
import { HousekeepingHandler, OrganisationHousekeepingHandler } from './housekeeping.handlers.ts';
import { HousekeepingService } from './services/housekeeping.service.ts';

@Module({
  imports: [RegistrationsModule],
  providers: [HousekeepingService, HousekeepingHandler, OrganisationHousekeepingHandler],
})
export class HousekeepingModule {}
