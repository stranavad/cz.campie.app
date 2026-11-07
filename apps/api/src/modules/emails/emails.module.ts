import { Module } from '@nestjs/common';

import { MailNotificationController } from './mail-notification/mail-notification.controller.ts';
import { MailNotificationService } from './mail-notification/services/mail-notification.service.ts';
import { UndeliverableEmailService } from './undeliverable-email/services/undeliverable-email.service.ts';

@Module({
  controllers: [MailNotificationController],
  providers: [MailNotificationService, UndeliverableEmailService],
  exports: [UndeliverableEmailService],
})
export class MailNotificationsModule {}
