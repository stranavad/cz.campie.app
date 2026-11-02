import { Global, Module } from '@nestjs/common';

import { RateLimiter } from './rate-limiter.ts';

@Global()
@Module({
  providers: [RateLimiter],
  exports: [RateLimiter],
})
export class RateLimitsModule {}
