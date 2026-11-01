import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { Clock } from './clock.port.ts';
import { ControllableClock } from './controllable-clock.adapter.ts';
import { SystemClock } from './system-clock.adapter.ts';

@Global()
@Module({
  providers: [
    {
      provide: Clock,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Clock =>
        config.get('clock', { infer: true }).adapter === 'system' ? new SystemClock() : new ControllableClock(),
    },
  ],
  exports: [Clock],
})
export class ClockModule {}
