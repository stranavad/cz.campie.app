import { Module } from '@nestjs/common';

import { OrganisationService } from './organisation/services/organisation.service.ts';

@Module({
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationsModule {}
