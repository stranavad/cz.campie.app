import { Module } from '@nestjs/common';

import { ConsentController } from './consent/consent.controller.ts';
import { ConsentService } from './consent/services/consent.service.ts';

@Module({
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentsModule {}
