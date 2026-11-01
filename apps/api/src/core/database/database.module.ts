import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.schema.ts';
import { Database } from './database.port.ts';
import { NeonDatabase } from './neon-database.adapter.ts';
import { PgDatabase } from './pg-database.adapter.ts';
import { UnitOfWork } from './unit-of-work.ts';

@Global()
@Module({
  providers: [
    {
      provide: Database,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Database => {
        const database = config.get('database', { infer: true });

        return database.adapter === 'neon' ? new NeonDatabase(database) : new PgDatabase(database);
      },
    },
    UnitOfWork,
  ],
  exports: [Database, UnitOfWork],
})
export class DatabaseModule {}
