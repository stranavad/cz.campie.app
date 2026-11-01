// Does a transaction-local current Organisation drive RLS on pooled connections, without leaking?
// Run from apps/api:
//   node spikes/rls-transactions.ts pg                                      (Compose PostgreSQL)
//   node spikes/rls-transactions.ts neon         (SPIKE_DATABASE_URL, a throwaway Neon branch, from env or .env)
// The URL's role owns the spike objects; the queries run as a separate non-owner role, as the app will.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { Pool as NeonPool } from '@neondatabase/serverless';
import pg from 'pg';

const driver = process.argv[2];
assert.ok(driver === 'pg' || driver === 'neon', 'usage: node spikes/rls-transactions.ts pg|neon');

/**
 * Read the Neon branch URL, falling back to apps/api/.env; the URL is a secret and never printed.
 */
function neonUrl(): string {
  if (process.env.SPIKE_DATABASE_URL === undefined) {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  }
  const url = process.env.SPIKE_DATABASE_URL;
  assert.ok(url !== undefined && url !== '', 'SPIKE_DATABASE_URL is not set');

  return url;
}

const ownerUrl = driver === 'neon' ? neonUrl() : 'postgres://campie:campie@localhost:15432/campie';
if (driver === 'neon') {
  console.log(`Neon endpoint: ${new URL(ownerUrl).hostname.includes('-pooler') ? 'pooled' : 'direct'}`);
}
// A fresh role per run: Neon's pooler keeps server connections logged in as a dropped role of the same name.
const APP_ROLE = `spike_app_${randomUUID().slice(0, 8)}`;
const APP_PASSWORD = `spike-${randomUUID()}`;
const POOL_SIZE = 2;
const TRANSACTIONS = 40;

const ORG_A = randomUUID();
const ORG_B = randomUUID();
const ROWS = { [ORG_A]: 2, [ORG_B]: 3 };

const createPool = (connectionString: string): pg.Pool =>
  // The Neon Pool mirrors pg's API; the cast keeps one code path for both drivers.
  driver === 'neon'
    ? (new NeonPool({ connectionString, max: POOL_SIZE }) as unknown as pg.Pool)
    : new pg.Pool({ connectionString, max: POOL_SIZE });

const owner = createPool(ownerUrl);

// A missing setting reads as NULL, but once a transaction set it locally the connection keeps it as ''
// after commit, so the policy treats both as "no Organisation".
await owner.query(`
  DROP SCHEMA IF EXISTS spike_rls CASCADE;
  DROP ROLE IF EXISTS ${APP_ROLE};
  CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}';
  CREATE SCHEMA spike_rls;
  CREATE TABLE spike_rls.items (id uuid PRIMARY KEY, organisation_id uuid NOT NULL);
  ALTER TABLE spike_rls.items ENABLE ROW LEVEL SECURITY;
  CREATE POLICY organisation_isolation ON spike_rls.items
    USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);
  GRANT USAGE ON SCHEMA spike_rls TO ${APP_ROLE};
  GRANT SELECT, INSERT ON spike_rls.items TO ${APP_ROLE};
`);
for (const [organisationId, count] of Object.entries(ROWS)) {
  for (let i = 0; i < count; i += 1) {
    await owner.query('INSERT INTO spike_rls.items VALUES ($1, $2)', [randomUUID(), organisationId]);
  }
}

const appUrl = new URL(ownerUrl);
appUrl.username = APP_ROLE;
appUrl.password = APP_PASSWORD;
const app = createPool(appUrl.toString());

/**
 * Open a transaction for one Organisation, hold it open across the other ones, and check what it sees.
 */
async function transactionFor(organisationId: string, index: number): Promise<void> {
  const client = await app.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.organisation_id', $1, true)", [organisationId]);
    // Yields so the other transactions interleave on the pool before this one reads.
    await sleep(5 + (index % 7) * 3);

    const { rows } = await client.query<{ organisation_id: string }>('SELECT organisation_id FROM spike_rls.items');
    assert.equal(rows.length, ROWS[organisationId]);
    assert.ok(rows.every((row) => row.organisation_id === organisationId));

    const other = organisationId === ORG_A ? ORG_B : ORG_A;
    await client.query('SAVEPOINT foreign_write');
    await assert.rejects(
      client.query('INSERT INTO spike_rls.items VALUES ($1, $2)', [randomUUID(), other]),
      /row-level security/,
    );
    await client.query('ROLLBACK TO SAVEPOINT foreign_write');

    // Every other transaction rolls back, so the pool also hands out connections a rollback ended.
    await client.query(index % 2 === 0 ? 'COMMIT' : 'ROLLBACK');
  } finally {
    client.release();
  }
}

const readOutside = async (): Promise<number> =>
  (await app.query('SELECT organisation_id FROM spike_rls.items')).rows.length;

try {
  assert.equal(await readOutside(), 0, 'nothing is visible before any transaction');

  await Promise.all(
    Array.from({ length: TRANSACTIONS }, (_, index) => transactionFor(index % 2 === 0 ? ORG_A : ORG_B, index)),
  );
  console.log(`ok  ${TRANSACTIONS} concurrent transactions on ${POOL_SIZE} pooled connections saw only their rows`);

  // Every pooled connection has run a transaction by now; none may keep its Organisation.
  for (let i = 0; i < POOL_SIZE * 3; i += 1) {
    assert.equal(await readOutside(), 0, 'nothing is visible outside a transaction');
  }
  await assert.rejects(
    app.query('INSERT INTO spike_rls.items VALUES ($1, $2)', [randomUUID(), ORG_A]),
    /row-level security/,
  );
  console.log('ok  outside a transaction: no rows, writes rejected');

  console.log(`${driver} passed every check`);
} finally {
  await app.end();
  await owner.query(`DROP SCHEMA spike_rls CASCADE; DROP ROLE ${APP_ROLE};`);
  await owner.end();
}
