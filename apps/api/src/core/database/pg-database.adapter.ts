import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { relations } from '../../db/relations.ts';
import type { Env } from '../config/env.schema.ts';
import { CONNECTION_TIMEOUT_MS, Database, POOL_MAX } from './database.port.ts';

// Standard PostgreSQL over TCP; locally the Compose PostgreSQL, in tests a container.
export class PgDatabase extends Database implements OnModuleDestroy {
  private readonly logger = new Logger(PgDatabase.name);
  private readonly pool: pg.Pool;
  public readonly drizzle;

  constructor(config: Env['database']) {
    super();
    this.pool = new pg.Pool({
      connectionString: config.url,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      max: POOL_MAX,
    });
    // An idle connection that breaks is dropped from the pool; unheard, the error would end the process.
    this.pool.on('error', (error: Error) => this.logger.warn(`idle database connection failed: ${error.message}`));
    this.drizzle = drizzle({ client: this.pool, relations });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
