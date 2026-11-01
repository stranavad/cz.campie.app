import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api-postgres';
import * as p from 'drizzle-orm/pg-core';

import { encrypted } from '../db/helpers/encrypted.ts';
import { id } from '../db/helpers/ids.ts';
import { organisationId, organisationPolicy } from '../db/helpers/organisation.ts';
import * as schema from '../db/schema.ts';
import { withClient } from './services/postgres.ts';

// An Organisation-owned table built with the same helpers as real ones, so tests of tenancy do not wait
// for the first domain table, and prove the helpers themselves.
export const notes = p.snakeCase.table.withRLS(
  'test_notes',
  {
    id: id(),
    organisationId: organisationId().references(() => schema.organisations.id),
    text: p.text().notNull(),
    secret: encrypted(),
  },
  () => [organisationPolicy()],
);

/**
 * Create the table in a database, with the DDL drizzle-kit generates for it, as its owner.
 * @param ownerUrl the database, as the role that owns the tables
 */
export async function createNotesTable(ownerUrl: string): Promise<void> {
  const statements = await generateMigration(
    await generateDrizzleJson(schema),
    await generateDrizzleJson({ ...schema, notes }),
  );

  await withClient(ownerUrl, async (client) => {
    for (const statement of statements) {
      await client.query(statement);
    }
  });
}
