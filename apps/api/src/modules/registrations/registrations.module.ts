import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { OrganisationsModule } from '../organisations/organisations.module.ts';
import { AdminRegistrationController } from './admin-registration/admin-registration.controller.ts';
import { AdminRegistrationService } from './admin-registration/services/admin-registration.service.ts';
import { SendCancellationHandler } from './cancellation/send-cancellation.handler.ts';
import { CancellationService } from './cancellation/services/cancellation.service.ts';
import { ComgateNotificationController } from './card-payment/comgate-notification.controller.ts';
import { PublicCardPaymentController } from './card-payment/public-card-payment.controller.ts';
import { CardPaymentService } from './card-payment/services/card-payment.service.ts';
import { GuardianChecklistController } from './checklist/guardian-checklist.controller.ts';
import { ChecklistService } from './checklist/services/checklist.service.ts';
import { SendConfirmationHandler } from './confirmation/send-confirmation.handler.ts';
import { ConfirmationService } from './confirmation/services/confirmation.service.ts';
import { EmailChangeConfirmedHandler } from './guardian-email/guardian-email-notice.handler.ts';
import { GuardianEmailNoticeService } from './guardian-email/services/guardian-email-notice.service.ts';
import { LedgerController } from './ledger/ledger.controller.ts';
import { SendPaymentReceivedHandler } from './ledger/send-payment-received.handler.ts';
import { LedgerService } from './ledger/services/ledger.service.ts';
import { OpenItemsReminderController } from './open-items-reminder/open-items-reminder.controller.ts';
import { SendOpenItemsReminderHandler } from './open-items-reminder/send-open-items-reminder.handler.ts';
import { OpenItemsReminderService } from './open-items-reminder/services/open-items-reminder.service.ts';
import { ExportParticipantsHandler, RemoveExportHandler } from './participant-export/export-participants.handler.ts';
import { ParticipantExportController } from './participant-export/participant-export.controller.ts';
import { ParticipantExportService } from './participant-export/services/participant-export.service.ts';
import { ParticipantListController } from './participant-list/participant-list.controller.ts';
import { ParticipantListService } from './participant-list/services/participant-list.service.ts';
import { PaymentReminderController } from './payment-reminder/payment-reminder.controller.ts';
import { SendPaymentReminderHandler } from './payment-reminder/send-payment-reminder.handler.ts';
import { PaymentReminderService } from './payment-reminder/services/payment-reminder.service.ts';
import { GeneratePrihlaskyHandler } from './prihlaska/generate-prihlasky.handler.ts';
import { RegeneratePrihlaskaHandler } from './prihlaska/regenerate-prihlaska.handler.ts';
import { PrihlaskaService } from './prihlaska/services/prihlaska.service.ts';
import { RegistrationDetailController } from './registration-detail/registration-detail.controller.ts';
import { RegistrationDetailService } from './registration-detail/services/registration-detail.service.ts';
import { NotifyTeamHandler } from './registration/notify-team.handler.ts';
import { PublicRegistrationController } from './registration/public-registration.controller.ts';
import { RegistrationService } from './registration/services/registration.service.ts';
import { VariableSymbols } from './registration/services/variable-symbols.ts';

@Module({
  imports: [CampsModule, OrganisationsModule],
  controllers: [
    PublicRegistrationController,
    LedgerController,
    ParticipantListController,
    RegistrationDetailController,
    AdminRegistrationController,
    ParticipantExportController,
    ComgateNotificationController,
    PublicCardPaymentController,
    PaymentReminderController,
    GuardianChecklistController,
    OpenItemsReminderController,
  ],
  providers: [
    RegistrationService,
    VariableSymbols,
    PrihlaskaService,
    ConfirmationService,
    LedgerService,
    ParticipantListService,
    RegistrationDetailService,
    AdminRegistrationService,
    GuardianEmailNoticeService,
    CancellationService,
    ParticipantExportService,
    CardPaymentService,
    PaymentReminderService,
    ChecklistService,
    OpenItemsReminderService,
    SendOpenItemsReminderHandler,
    SendPaymentReminderHandler,
    ExportParticipantsHandler,
    RemoveExportHandler,
    SendCancellationHandler,
    RegeneratePrihlaskaHandler,
    EmailChangeConfirmedHandler,
    NotifyTeamHandler,
    GeneratePrihlaskyHandler,
    SendConfirmationHandler,
    SendPaymentReceivedHandler,
  ],
  exports: [RegistrationService, PrihlaskaService, LedgerService, CardPaymentService],
})
export class RegistrationsModule {}
