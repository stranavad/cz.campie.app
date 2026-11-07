import { Module } from '@nestjs/common';

import { AdminsModule } from '../admins/admins.module.ts';
import { CampsModule } from '../camps/camps.module.ts';
import { PublicLogoController } from './logo/public-logo.controller.ts';
import { LogoService } from './logo/services/logo.service.ts';
import { OrganisationSettingsController } from './organisation-settings/organisation-settings.controller.ts';
import { OrganisationSettingsService } from './organisation-settings/services/organisation-settings.service.ts';
import { OrganisationSignedUpHandler } from './organisation/organisation-signed-up.handler.ts';
import { OrganisationController } from './organisation/organisation.controller.ts';
import { PublicOrganisationController } from './organisation/public-organisation.controller.ts';
import { OrganisationService } from './organisation/services/organisation.service.ts';
import { PaymentGatewayController } from './payment-gateway/payment-gateway.controller.ts';
import { PaymentGatewayService } from './payment-gateway/services/payment-gateway.service.ts';

@Module({
  imports: [AdminsModule, CampsModule],
  controllers: [
    OrganisationController,
    PublicOrganisationController,
    OrganisationSettingsController,
    PublicLogoController,
    PaymentGatewayController,
  ],
  providers: [
    OrganisationService,
    OrganisationSettingsService,
    PaymentGatewayService,
    LogoService,
    OrganisationSignedUpHandler,
  ],
  exports: [OrganisationService, PaymentGatewayService],
})
export class OrganisationsModule {}
