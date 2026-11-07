import { Module } from '@nestjs/common';

import { RegistrationsModule } from '../registrations/registrations.module.ts';
import { GuardianChecklistController } from './checklist/guardian-checklist.controller.ts';
import { ChecklistService } from './checklist/services/checklist.service.ts';

@Module({
  imports: [RegistrationsModule],
  controllers: [GuardianChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
