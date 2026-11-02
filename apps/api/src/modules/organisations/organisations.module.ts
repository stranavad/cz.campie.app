import { Module } from '@nestjs/common';

import { AdminsModule } from '../admins/admins.module.ts';
import { CampsModule } from '../camps/camps.module.ts';
import { OrganisationSignedUpHandler } from './organisation/organisation-signed-up.handler.ts';
import { OrganisationController } from './organisation/organisation.controller.ts';
import { PublicOrganisationController } from './organisation/public-organisation.controller.ts';
import { OrganisationService } from './organisation/services/organisation.service.ts';

@Module({
  imports: [AdminsModule, CampsModule],
  controllers: [OrganisationController, PublicOrganisationController],
  providers: [OrganisationService, OrganisationSignedUpHandler],
  exports: [OrganisationService],
})
export class OrganisationsModule {}
