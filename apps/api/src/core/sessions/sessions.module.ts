import { Global, Module } from '@nestjs/common';

import { SessionService } from './session.service.ts';

@Global()
@Module({
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionsModule {}
