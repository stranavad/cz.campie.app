import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { MailNotificationsModule } from '../emails/emails.module.ts';
import { RegistrationsModule } from '../registrations/registrations.module.ts';
import { PortalCardPaymentController } from './card-payment/portal-card-payment.controller.ts';
import { GuardianEditController } from './guardian-edit/guardian-edit.controller.ts';
import { EmailChangeRequestedHandler } from './guardian-edit/guardian-edit.handlers.ts';
import { PublicEmailChangeController } from './guardian-edit/public-email-change.controller.ts';
import { GuardianEditService } from './guardian-edit/services/guardian-edit.service.ts';
import { GuardianEmailChangeService } from './guardian-edit/services/guardian-email-change.service.ts';
import { GuardianRegistrationController } from './guardian-registration/guardian-registration.controller.ts';
import { GuardianRegistrationService } from './guardian-registration/services/guardian-registration.service.ts';
import { GuardianSessionController } from './guardian-session/guardian-session.controller.ts';
import { LoginLinkRequestedHandler } from './guardian-session/login-link-requested.handler.ts';
import { GuardianLoginService } from './guardian-session/services/guardian-login.service.ts';
import { GuardianInvoiceRequestController } from './invoice-request/guardian-invoice-request.controller.ts';
import { GuardianInvoiceRequestService } from './invoice-request/services/guardian-invoice-request.service.ts';

@Module({
  imports: [CampsModule, RegistrationsModule, MailNotificationsModule],
  controllers: [
    GuardianSessionController,
    GuardianRegistrationController,
    GuardianEditController,
    PublicEmailChangeController,
    PortalCardPaymentController,
    GuardianInvoiceRequestController,
  ],
  providers: [
    GuardianLoginService,
    GuardianRegistrationService,
    GuardianEditService,
    GuardianEmailChangeService,
    GuardianInvoiceRequestService,
    LoginLinkRequestedHandler,
    EmailChangeRequestedHandler,
  ],
})
export class PortalModule {}
