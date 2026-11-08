import { Module } from '@nestjs/common';

import { AccountController } from './account/account.controller.ts';
import { AccountService } from './account/services/account.service.ts';
import { AdminService } from './admin/services/admin.service.ts';
import { EmailVerificationLinkController } from './email-verification/email-verification-link.controller.ts';
import { EmailVerificationRequestedHandler } from './email-verification/email-verification-requested.handler.ts';
import { EmailVerificationController } from './email-verification/email-verification.controller.ts';
import { EmailVerificationService } from './email-verification/services/email-verification.service.ts';
import { InvitationAcceptanceController } from './invitation/invitation-acceptance.controller.ts';
import { InvitationCreatedHandler } from './invitation/invitation-created.handler.ts';
import { InvitationController } from './invitation/invitation.controller.ts';
import { InvitationService } from './invitation/services/invitation.service.ts';
import { LoginController } from './login/login.controller.ts';
import { LoginService } from './login/services/login.service.ts';
import { MemberController } from './member/member.controller.ts';
import { OwnerChangedHandler } from './membership/owner-changed.handler.ts';
import { MembershipService } from './membership/services/membership.service.ts';
import { PasswordResetRequestedHandler } from './password-reset/password-reset-requested.handler.ts';
import { PasswordResetController } from './password-reset/password-reset.controller.ts';
import { PasswordResetService } from './password-reset/services/password-reset.service.ts';
import { RecoveryCodesRegeneratedHandler } from './totp/recovery-codes-regenerated.handler.ts';
import { TotpService } from './totp/services/totp.service.ts';
import { TotpResetHandler } from './totp/totp-reset.handler.ts';
import { TotpController } from './totp/totp.controller.ts';

@Module({
  controllers: [
    AccountController,
    LoginController,
    PasswordResetController,
    EmailVerificationController,
    EmailVerificationLinkController,
    MemberController,
    InvitationController,
    InvitationAcceptanceController,
    TotpController,
  ],
  providers: [
    AdminService,
    MembershipService,
    OwnerChangedHandler,
    AccountService,
    LoginService,
    PasswordResetService,
    PasswordResetRequestedHandler,
    EmailVerificationService,
    EmailVerificationRequestedHandler,
    InvitationService,
    InvitationCreatedHandler,
    TotpService,
    TotpResetHandler,
    RecoveryCodesRegeneratedHandler,
  ],
  exports: [AdminService, MembershipService, TotpService, EmailVerificationService],
})
export class AdminsModule {}
