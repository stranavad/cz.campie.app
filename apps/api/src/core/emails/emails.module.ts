import { Global, Module } from '@nestjs/common';

import { EmailService } from './email.service.ts';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailsModule {}
