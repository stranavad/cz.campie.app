import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { LogMailSender } from './log-mail-sender.adapter.ts';
import { MailSender } from './mail-sender.port.ts';
import { ResendMailSender } from './resend-mail-sender.adapter.ts';

@Global()
@Module({
  providers: [
    {
      provide: MailSender,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): MailSender => {
        const mail = config.get('mail', { infer: true });

        return mail.adapter === 'resend' ? new ResendMailSender(mail.apiKey) : new LogMailSender();
      },
    },
  ],
  exports: [MailSender],
})
export class MailSenderModule {}
