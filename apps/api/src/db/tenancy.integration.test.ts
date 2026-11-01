import { describe, expect, it } from 'vitest';

import { withClient } from '../testing/services/postgres.ts';
import { findTenancyViolations } from '../testing/tenancy-check.ts';
import { createNotesTable } from '../testing/tenant-table.ts';
import { useTestApp } from '../testing/test-app.ts';

// The CI check that keeps every table Organisation-scoped: it reads the migrated database, so it holds
// however a table or policy was declared.
describe('tenancy of the schema', () => {
  const { database } = useTestApp();

  it('finds every migrated table Organisation-scoped or on the platform list, as the helpers make them', async () => {
    await createNotesTable(database().ownerUrl);

    expect(await withClient(database().ownerUrl, findTenancyViolations)).toEqual([]);
  });

  it('names tables without organisation_id or the organisation policy, and views that bypass row-level security', async () => {
    await withClient(database().ownerUrl, (client) =>
      client.query(`
        CREATE TABLE unscoped (id uuid PRIMARY KEY);
        CREATE TABLE open_to_all (id uuid PRIMARY KEY, organisation_id uuid NOT NULL);
        ALTER TABLE open_to_all ENABLE ROW LEVEL SECURITY;
        CREATE POLICY organisation_isolation ON open_to_all TO campie_app USING (true) WITH CHECK (true);
        CREATE VIEW owner_view AS SELECT id FROM open_to_all;
        CREATE VIEW invoker_view WITH (security_invoker) AS SELECT id FROM open_to_all;
        CREATE MATERIALIZED VIEW snapshot AS SELECT id FROM open_to_all;
      `),
    );

    expect(await withClient(database().ownerUrl, findTenancyViolations)).toEqual([
      'open_to_all: needs exactly one permissive policy, organisation_isolation for all commands to campie_app, admitting only the current Organisation',
      'owner_view: is a view that reads as its owner, past row-level security; declare it with security_invoker',
      'snapshot: is a materialized view, which row-level security cannot reach',
      'unscoped: has no NOT NULL uuid organisation_id column',
      'unscoped: has row-level security off',
      'unscoped: needs exactly one permissive policy, organisation_isolation for all commands to campie_app, admitting only the current Organisation',
    ]);
  });
});
