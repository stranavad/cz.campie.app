import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { PublicRegistrationController } from './registration/public-registration.controller.ts';
import { RegistrationSubmittedHandler } from './registration/registration-submitted.handler.ts';
import { RegistrationService } from './registration/services/registration.service.ts';
import { VariableSymbols } from './registration/services/variable-symbols.ts';

@Module({
  imports: [CampsModule],
  controllers: [PublicRegistrationController],
  providers: [RegistrationService, VariableSymbols, RegistrationSubmittedHandler],
  exports: [RegistrationService],
})
export class RegistrationsModule {}
