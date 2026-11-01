import { Module } from '@nestjs/common';

import { AdminService } from './admin/services/admin.service.ts';
import { MembershipService } from './membership/services/membership.service.ts';

@Module({
  providers: [AdminService, MembershipService],
  exports: [AdminService, MembershipService],
})
export class AdminsModule {}
