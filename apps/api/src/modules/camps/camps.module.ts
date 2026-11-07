import { Module } from '@nestjs/common';

import { CampBrandingController } from './camp-branding/camp-branding.controller.ts';
import { CampBrandingService } from './camp-branding/services/camp-branding.service.ts';
import { CampController } from './camp/camp.controller.ts';
import { PublicCampController } from './camp/public-camp.controller.ts';
import { CampService } from './camp/services/camp.service.ts';
import { DiscountCodeController } from './discount-code/discount-code.controller.ts';
import { DiscountCodeService } from './discount-code/services/discount-code.service.ts';
import { PublicRegistrationFormController } from './registration-form/public-registration-form.controller.ts';
import { RegistrationFormController } from './registration-form/registration-form.controller.ts';
import { RegistrationFormService } from './registration-form/services/registration-form.service.ts';
import { TurnusService } from './turnus/services/turnus.service.ts';
import { TurnusController } from './turnus/turnus.controller.ts';

@Module({
  controllers: [
    CampController,
    PublicCampController,
    CampBrandingController,
    TurnusController,
    DiscountCodeController,
    RegistrationFormController,
    PublicRegistrationFormController,
  ],
  providers: [CampService, CampBrandingService, TurnusService, DiscountCodeService, RegistrationFormService],
  exports: [CampService, CampBrandingService, TurnusService, DiscountCodeService, RegistrationFormService],
})
export class CampsModule {}
