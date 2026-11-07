import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { AdminConsentController } from './admin-status/admin-consent.controller.ts';
import { AdminConsentService } from './admin-status/services/admin-consent.service.ts';
import { ConsentController } from './consent/consent.controller.ts';
import { ConsentService } from './consent/services/consent.service.ts';
import { ConsentSignatureController } from './signature/consent-signature.controller.ts';
import { ConsentSignatureService } from './signature/services/consent-signature.service.ts';
import { GenerateSignedConsentHandler, SendConsentCopyHandler } from './signature/signature.handlers.ts';

@Module({
  imports: [CampsModule],
  controllers: [ConsentController, ConsentSignatureController, AdminConsentController],
  providers: [
    ConsentService,
    ConsentSignatureService,
    AdminConsentService,
    GenerateSignedConsentHandler,
    SendConsentCopyHandler,
  ],
  exports: [ConsentService],
})
export class ConsentsModule {}
