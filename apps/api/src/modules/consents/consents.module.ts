import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { ConsentController } from './consent/consent.controller.ts';
import { ConsentService } from './consent/services/consent.service.ts';
import { ConsentSignatureController } from './signature/consent-signature.controller.ts';
import { ConsentSignatureService } from './signature/services/consent-signature.service.ts';
import { GenerateSignedConsentHandler, SendConsentCopyHandler } from './signature/signature.handlers.ts';

@Module({
  imports: [CampsModule],
  controllers: [ConsentController, ConsentSignatureController],
  providers: [ConsentService, ConsentSignatureService, GenerateSignedConsentHandler, SendConsentCopyHandler],
  exports: [ConsentService],
})
export class ConsentsModule {}
