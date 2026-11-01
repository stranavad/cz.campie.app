import { randomUUID } from 'node:crypto';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import { appRole } from '../../db/helpers/organisation.ts';

// The same image as Docker Compose, so tests run on the PostgreSQL the platform runs on.
const IMAGE = 'postgres:18.6-alpine';
const TEMPLATE = 'migrated';
// Test-only: the container lives for one run and listens on localhost alone.
const APP_PASSWORD = 'campie_app';

export interface PostgresServer {
  // The container's superuser, standing in for the role that owns the tables in production.
  readonly ownerUrl: string;
}

export interface IsolatedDatabase {
  // As the owner, for arranging and inspecting data around what the app does.
  readonly ownerUrl: string;
  // As the application role, which row-level security applies to; the app connects with this.
  readonly appUrl: string;
  readonly drop: () => Promise<void>;
}

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

// Starts PostgreSQL once per run, migrates a template database, and gives the application role a
// login, as provisioning does in a deployment.
export async function startPostgres(): Promise<{ server: PostgresServer; stop: () => Promise<void> }> {
  const container = await new PostgreSqlContainer(IMAGE).withTmpFs({ '/var/lib/postgresql': 'rw' }).start();
  const ownerUrl = container.getConnectionUri();

  await withClient(ownerUrl, (client) => client.query(`CREATE DATABASE ${TEMPLATE}`));

  const pool = new pg.Pool({ connectionString: withDatabase(ownerUrl, TEMPLATE) });
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: new URL('../../../drizzle', import.meta.url).pathname,
    });
    await pool.query(`ALTER ROLE ${appRole.name} LOGIN PASSWORD '${APP_PASSWORD}'`);
  } finally {
    await pool.end();
  }

  return { server: { ownerUrl }, stop: async () => void (await container.stop()) };
}

// A fresh database copied from the migrated template, so no test sees another's rows.
export async function isolatePostgres(server: PostgresServer): Promise<IsolatedDatabase> {
  const database = `test_${randomUUID().replaceAll('-', '')}`;

  await withClient(server.ownerUrl, (client) => client.query(`CREATE DATABASE ${database} TEMPLATE ${TEMPLATE}`));

  return {
    ownerUrl: withDatabase(server.ownerUrl, database),
    appUrl: withDatabase(server.ownerUrl, database, { user: appRole.name, password: APP_PASSWORD }),
    drop: async () => {
      await withClient(server.ownerUrl, (client) => client.query(`DROP DATABASE ${database} WITH (FORCE)`));
    },
  };
}
