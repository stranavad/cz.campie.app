import { Module } from '@nestjs/common';

import { AppConfigModule } from './core/config/config.module.ts';
import { HealthModule } from './core/health/health.module.ts';

@Module({
  imports: [AppConfigModule, HealthModule],
})
export class AppModule {}
