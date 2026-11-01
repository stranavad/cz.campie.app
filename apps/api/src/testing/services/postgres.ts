import { randomUUID } from 'node:crypto';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import { appRole } from '../../db/helpers/organisation.ts';
import type { ServiceEnv, TestService } from './test-service.ts';

// The same image as Docker Compose, so tests run on the PostgreSQL the platform runs on.
const IMAGE = 'postgres:18.6-alpine';
const TEMPLATE = 'migrated';
// Test-only: the container lives for one run and listens on localhost alone.
const APP_PASSWORD = 'campie_app';
// The variable holding the URL as the role that owns the tables, named as drizzle-kit reads it; the
// container's superuser stands in for the owner. Tests arrange and inspect data with it, the app never
// reads it.
const OWNER_URL_VARIABLE = 'MIGRATION_DATABASE_URL';
const APP_URL_VARIABLE = 'DATABASE_URL';

function withDatabase(url: string, database: string, credentials?: { user: string; password: string }): string {
  const result = new URL(url);
  result.pathname = `/${database}`;

  if (credentials !== undefined) {
    result.username = credentials.user;
    result.password = credentials.password;
  }

  return result.toString();
}

export async function withClient<T>(url: string, work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

// PostgreSQL starts once per run with a migrated template database; each test gets a copy of it
// (milliseconds, data on tmpfs), so no test sees another's rows.
export const postgres = {
  async start() {
    const container = await new PostgreSqlContainer(IMAGE).withTmpFs({ '/var/lib/postgresql': 'rw' }).start();
    const ownerUrl = container.getConnectionUri();

    await withClient(ownerUrl, (client) => client.query(`CREATE DATABASE ${TEMPLATE}`));
    await withClient(withDatabase(ownerUrl, TEMPLATE), async (client) => {
      await migrate(drizzle({ client }), { migrationsFolder: new URL('../../../drizzle', import.meta.url).pathname });
      // A login for the application role, as provisioning gives it in a deployment.
      await client.query(`ALTER ROLE ${appRole.name} LOGIN PASSWORD '${APP_PASSWORD}'`);
    });

    return { env: { [OWNER_URL_VARIABLE]: ownerUrl }, cleanup: async () => void (await container.stop()) };
  },

  async isolate(env) {
    const serverUrl = env[OWNER_URL_VARIABLE];

    if (serverUrl === undefined) {
      throw new Error(`The postgres test service provided no ${OWNER_URL_VARIABLE}`);
    }

    const database = `test_${randomUUID().replaceAll('-', '')}`;
    await withClient(serverUrl, (client) => client.query(`CREATE DATABASE ${database} TEMPLATE ${TEMPLATE}`));

    return {
      env: {
        [OWNER_URL_VARIABLE]: withDatabase(serverUrl, database),
        [APP_URL_VARIABLE]: withDatabase(serverUrl, database, { user: appRole.name, password: APP_PASSWORD }),
      },
      cleanup: async () => {
        await withClient(serverUrl, (client) => client.query(`DROP DATABASE ${database} WITH (FORCE)`));
      },
    };
  },
} satisfies TestService;

/**
 * The test's database, from the env its isolation returned.
 * @param env a test's isolated service env
 */
export function testDatabase(env: ServiceEnv): { ownerUrl: string; appUrl: string } {
  const ownerUrl = env[OWNER_URL_VARIABLE];
  const appUrl = env[APP_URL_VARIABLE];

  if (ownerUrl === undefined || appUrl === undefined) {
    throw new Error('The postgres test service has not isolated a database for this test');
  }

  return { ownerUrl, appUrl };
}
