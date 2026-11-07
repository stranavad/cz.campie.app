import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { FakeMailSender } from './fake-mail-sender.adapter.ts';
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

        switch (mail.adapter) {
          case 'resend':
            return new ResendMailSender(mail.apiKey, mail.webhookSecret);
          case 'log':
            return new LogMailSender();
          case 'fake':
            return new FakeMailSender();
        }
      },
    },
  ],
  exports: [MailSender],
})
export class MailSenderModule {}
