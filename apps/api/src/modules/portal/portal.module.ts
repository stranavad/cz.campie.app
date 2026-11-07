import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { RegistrationsModule } from '../registrations/registrations.module.ts';
import { GuardianRegistrationController } from './guardian-registration/guardian-registration.controller.ts';
import { GuardianRegistrationService } from './guardian-registration/services/guardian-registration.service.ts';
import { GuardianSessionController } from './guardian-session/guardian-session.controller.ts';
import { LoginLinkRequestedHandler } from './guardian-session/login-link-requested.handler.ts';
import { GuardianLoginService } from './guardian-session/services/guardian-login.service.ts';

@Module({
  imports: [CampsModule, RegistrationsModule],
  controllers: [GuardianSessionController, GuardianRegistrationController],
  providers: [GuardianLoginService, GuardianRegistrationService, LoginLinkRequestedHandler],
})
export class PortalModule {}
