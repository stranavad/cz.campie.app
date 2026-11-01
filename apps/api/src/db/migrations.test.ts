import { readdir, readFile } from 'node:fs/promises';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api-postgres';
import { expect, it } from 'vitest';

import * as schema from './schema.ts';

const MIGRATIONS = new URL('../../drizzle/', import.meta.url);

it('has a migration for every schema change (run pnpm db:generate)', async () => {
  const folders = (await readdir(MIGRATIONS, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
  const last = folders.at(-1);

  if (last === undefined) {
    throw new Error('No migrations in drizzle/');
  }

  const snapshot = JSON.parse(await readFile(new URL(`${last}/snapshot.json`, MIGRATIONS), 'utf8'));
  const current = await generateDrizzleJson(schema, snapshot.id);

  expect(await generateMigration(snapshot, current)).toEqual([]);
});
