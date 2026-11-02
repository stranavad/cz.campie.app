import { Module } from '@nestjs/common';

import { AccountController } from './account/account.controller.ts';
import { AccountService } from './account/services/account.service.ts';
import { AdminService } from './admin/services/admin.service.ts';
import { MembershipService } from './membership/services/membership.service.ts';

@Module({
  controllers: [AccountController],
  providers: [AdminService, MembershipService, AccountService],
  exports: [AdminService, MembershipService],
})
export class AdminsModule {}
