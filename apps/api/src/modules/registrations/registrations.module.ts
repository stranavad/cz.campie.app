import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { SendConfirmationHandler } from './confirmation/send-confirmation.handler.ts';
import { ConfirmationService } from './confirmation/services/confirmation.service.ts';
import { LedgerController } from './ledger/ledger.controller.ts';
import { SendPaymentReceivedHandler } from './ledger/send-payment-received.handler.ts';
import { LedgerService } from './ledger/services/ledger.service.ts';
import { ParticipantListController } from './participant-list/participant-list.controller.ts';
import { ParticipantListService } from './participant-list/services/participant-list.service.ts';
import { GeneratePrihlaskyHandler } from './prihlaska/generate-prihlasky.handler.ts';
import { PrihlaskaService } from './prihlaska/services/prihlaska.service.ts';
import { RegistrationDetailController } from './registration-detail/registration-detail.controller.ts';
import { RegistrationDetailService } from './registration-detail/services/registration-detail.service.ts';
import { NotifyTeamHandler } from './registration/notify-team.handler.ts';
import { PublicRegistrationController } from './registration/public-registration.controller.ts';
import { RegistrationService } from './registration/services/registration.service.ts';
import { VariableSymbols } from './registration/services/variable-symbols.ts';

@Module({
  imports: [CampsModule],
  controllers: [
    PublicRegistrationController,
    LedgerController,
    ParticipantListController,
    RegistrationDetailController,
  ],
  providers: [
    RegistrationService,
    VariableSymbols,
    PrihlaskaService,
    ConfirmationService,
    LedgerService,
    ParticipantListService,
    RegistrationDetailService,
    NotifyTeamHandler,
    GeneratePrihlaskyHandler,
    SendConfirmationHandler,
    SendPaymentReceivedHandler,
  ],
  exports: [RegistrationService, PrihlaskaService, LedgerService],
})
export class RegistrationsModule {}
