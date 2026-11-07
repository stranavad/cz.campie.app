import { Pool } from '@neondatabase/serverless';
import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { relations } from '../../db/relations.ts';
import type { Env } from '../config/env.schema.ts';
import { CONNECTION_TIMEOUT_MS, Database, POOL_MAX } from './database.port.ts';

// Neon's serverless driver over WebSocket (Node's built-in one). Its HTTP mode has no interactive
// transactions, which the unit of work needs; the pooled endpoint works, as it keeps a transaction on
// one server connection.
export class NeonDatabase extends Database implements OnModuleDestroy {
  private readonly logger = new Logger(NeonDatabase.name);
  private readonly pool: Pool;
  public readonly drizzle;

  constructor(config: Env['database']) {
    super();
    this.pool = new Pool({
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
