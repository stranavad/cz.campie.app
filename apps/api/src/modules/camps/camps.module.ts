import { Module } from '@nestjs/common';

import { CampBrandingController } from './camp-branding/camp-branding.controller.ts';
import { CampBrandingService } from './camp-branding/services/camp-branding.service.ts';
import { CampController } from './camp/camp.controller.ts';
import { PublicCampController } from './camp/public-camp.controller.ts';
import { CampService } from './camp/services/camp.service.ts';

@Module({
  controllers: [CampController, PublicCampController, CampBrandingController],
  providers: [CampService, CampBrandingService],
  exports: [CampService, CampBrandingService],
})
export class CampsModule {}
