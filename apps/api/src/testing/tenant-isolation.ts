import { expect } from 'vitest';

import { withClient } from './services/postgres.ts';

type Snapshot = Record<string, unknown[]>;

/**
 * Read every row of every table, as the owner past row-level security, in a stable order.
 * @param ownerUrl the test's database, as its owner
 */
export async function snapshot(ownerUrl: string): Promise<Snapshot> {
  return withClient(ownerUrl, async (client) => {
    const { rows: tables } = await client.query<{ schema: string; table: string }>(
      `SELECT schemaname AS schema, tablename AS table FROM pg_tables
       WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'drizzle') ORDER BY 1, 2`,
    );
    const result: Snapshot = {};

    for (const { schema, table } of tables) {
      const name = `${client.escapeIdentifier(schema)}.${client.escapeIdentifier(table)}`;
      const { rows } = await client.query<{ rows: unknown[] }>(
        `SELECT coalesce(json_agg(r ORDER BY r::text), '[]') AS rows FROM ${name} r`,
      );
      result[`${schema}.${table}`] = rows[0]?.rows ?? [];
    }

    return result;
  });
}

/**
 * Assert that a request of one Organisation reaching for another Organisation's data is answered with
 * not-found or forbidden and changes nothing in the whole database.
 * @param ownerUrl the test's database, as its owner
 * @param attempt sends the request with Organisation B's session and Organisation A's identifiers
 */
export async function expectIsolated(
  ownerUrl: string,
  attempt: () => PromiseLike<{ status: number; body: unknown }>,
): Promise<void> {
  const before = await snapshot(ownerUrl);
  const { status, body } = await attempt();

  expect(status, `answered ${status} ${JSON.stringify(body)}; must be not-found or forbidden`).toBeOneOf([403, 404]);
  expect(await snapshot(ownerUrl), 'the request changed data').toEqual(before);
}
