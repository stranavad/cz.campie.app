import { Module } from '@nestjs/common';

import { AccountController } from './account/account.controller.ts';
import { AccountService } from './account/services/account.service.ts';
import { AdminService } from './admin/services/admin.service.ts';
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

@Module({
  controllers: [
    AccountController,
    LoginController,
    PasswordResetController,
    MemberController,
    InvitationController,
    InvitationAcceptanceController,
  ],
  providers: [
    AdminService,
    MembershipService,
    OwnerChangedHandler,
    AccountService,
    LoginService,
    PasswordResetService,
    PasswordResetRequestedHandler,
    InvitationService,
    InvitationCreatedHandler,
  ],
  exports: [AdminService, MembershipService],
})
export class AdminsModule {}
