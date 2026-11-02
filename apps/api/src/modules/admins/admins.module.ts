import { Module } from '@nestjs/common';

import { AccountController } from './account/account.controller.ts';
import { AccountService } from './account/services/account.service.ts';
import { AdminService } from './admin/services/admin.service.ts';
import { LoginController } from './login/login.controller.ts';
import { LoginService } from './login/services/login.service.ts';
import { MembershipService } from './membership/services/membership.service.ts';
import { PasswordResetRequestedHandler } from './password-reset/password-reset-requested.handler.ts';
import { PasswordResetController } from './password-reset/password-reset.controller.ts';
import { PasswordResetService } from './password-reset/services/password-reset.service.ts';

@Module({
  controllers: [AccountController, LoginController, PasswordResetController],
  providers: [
    AdminService,
    MembershipService,
    AccountService,
    LoginService,
    PasswordResetService,
    PasswordResetRequestedHandler,
  ],
  exports: [AdminService, MembershipService],
})
export class AdminsModule {}
