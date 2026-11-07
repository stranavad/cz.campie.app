import { Module } from '@nestjs/common';

import { CampsModule } from '../camps/camps.module.ts';
import { RegistrationsModule } from '../registrations/registrations.module.ts';
import { GuardianChecklistController } from './checklist/guardian-checklist.controller.ts';
import { ChecklistService } from './checklist/services/checklist.service.ts';
import { OpenItemsReminderController } from './open-items-reminder/open-items-reminder.controller.ts';
import { SendOpenItemsReminderHandler } from './open-items-reminder/send-open-items-reminder.handler.ts';
import { OpenItemsReminderService } from './open-items-reminder/services/open-items-reminder.service.ts';

@Module({
  imports: [CampsModule, RegistrationsModule],
  controllers: [GuardianChecklistController, OpenItemsReminderController],
  providers: [ChecklistService, OpenItemsReminderService, SendOpenItemsReminderHandler],
  exports: [ChecklistService],
})
export class ChecklistModule {}
