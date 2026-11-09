import { Module } from '@nestjs/common';

import { MailNotificationsModule } from '../emails/emails.module.ts';
import { CampBrandingController } from './camp-branding/camp-branding.controller.ts';
import { CampBrandingService } from './camp-branding/services/camp-branding.service.ts';
import { CampEmailController } from './camp-email/camp-email.controller.ts';
import { CampEmailService } from './camp-email/services/camp-email.service.ts';
import { CampPhotoController } from './camp-photo/camp-photo.controller.ts';
import { PublicCampPhotoController } from './camp-photo/public-camp-photo.controller.ts';
import { CampPhotoService } from './camp-photo/services/camp-photo.service.ts';
import { CampController } from './camp/camp.controller.ts';
import { PublicCampController } from './camp/public-camp.controller.ts';
import { CampService } from './camp/services/camp.service.ts';
import { DiscountCodeController } from './discount-code/discount-code.controller.ts';
import { DiscountCodeService } from './discount-code/services/discount-code.service.ts';
import { PublicRegistrationFormController } from './registration-form/public-registration-form.controller.ts';
import { RegistrationFormController } from './registration-form/registration-form.controller.ts';
import { PricePreviewService } from './registration-form/services/price-preview.service.ts';
import { RegistrationFormService } from './registration-form/services/registration-form.service.ts';
import { TurnusService } from './turnus/services/turnus.service.ts';
import { TurnusController } from './turnus/turnus.controller.ts';

@Module({
  imports: [MailNotificationsModule],
  controllers: [
    CampController,
    PublicCampController,
    CampBrandingController,
    CampPhotoController,
    PublicCampPhotoController,
    TurnusController,
    DiscountCodeController,
    RegistrationFormController,
    PublicRegistrationFormController,
    CampEmailController,
  ],
  providers: [
    CampService,
    CampBrandingService,
    CampPhotoService,
    TurnusService,
    DiscountCodeService,
    RegistrationFormService,
    CampEmailService,
    PricePreviewService,
  ],
  exports: [
    CampService,
    CampBrandingService,
    TurnusService,
    DiscountCodeService,
    RegistrationFormService,
    CampEmailService,
  ],
})
export class CampsModule {}
