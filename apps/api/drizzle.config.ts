import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Migrations run as the role that owns the tables, never as the application role. Real env vars win;
// on a developer machine the URL comes from .env.
if (process.env.MIGRATION_DATABASE_URL === undefined && existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL ?? '' },
  entities: { roles: true },
});
