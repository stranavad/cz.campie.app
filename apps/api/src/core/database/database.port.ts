import { sql } from 'drizzle-orm';
import type { PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { PgAsyncDatabase, PgAsyncTransaction } from 'drizzle-orm/pg-core/async';

import type { relations } from '../../db/relations.ts';

export type Drizzle = PgAsyncDatabase<PgQueryResultHKT, typeof relations>;
export type Transaction = PgAsyncTransaction<PgQueryResultHKT, typeof relations>;

// Waits this long for a pooled connection, so a database that stops answering fails requests instead of
// holding them forever.
export const CONNECTION_TIMEOUT_MS = 10_000;

// The connection pool, as the application role. Only the unit of work opens transactions on it.
export abstract class Database {
  public abstract readonly drizzle: Drizzle;

  /**
   * Run a trivial query, for the health check.
   */
  public async ping(): Promise<void> {
    await this.drizzle.execute(sql`select 1`);
  }
}
