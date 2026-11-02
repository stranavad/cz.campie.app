import pg from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createOrganisation } from '../../testing/fixtures.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { useTestApp } from '../../testing/test-app.ts';

// Memberships are a platform table, so the application role reaches them in any transaction; the rule
// holds however the API changes them.
describe('an Organisation keeps an Owner', () => {
  const { app, database } = useTestApp();

  let organisationId: string;
  let first: string;
  let second: string;

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    first = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).id;
    second = (await createAdmin(app(), { memberOf: [organisationId] })).id;
  });

  const asApp = (sql: string, values: unknown[] = []) =>
    withClient(database().appUrl, (client) => client.query(sql, values));

  const owners = async () =>
    (
      await asApp('SELECT admin_id FROM memberships WHERE organisation_id = $1 AND owner ORDER BY admin_id', [
        organisationId,
      ])
    ).rows.map((row: { admin_id: string }) => row.admin_id);

  it('refuses to demote or remove the last Owner', async () => {
    const violation = { constraint: 'memberships_keep_an_owner' };

    await expect(asApp('UPDATE memberships SET owner = false WHERE admin_id = $1', [first])).rejects.toMatchObject(
      violation,
    );
    await expect(asApp('DELETE FROM memberships WHERE admin_id = $1', [first])).rejects.toMatchObject(violation);
    await expect(asApp('DELETE FROM admins WHERE id = $1', [first])).rejects.toMatchObject(violation);

    expect(await owners()).toEqual([first]);
  });

  it('lets an Owner step down once another member is an Owner, in either order within one transaction', async () => {
    await asApp(`
      BEGIN;
      UPDATE memberships SET owner = false WHERE admin_id = '${first}';
      UPDATE memberships SET owner = true WHERE admin_id = '${second}';
      COMMIT;
    `);

    expect(await owners()).toEqual([second]);
  });

  it('lets only one of two Owners demoting each other at the same moment commit', async () => {
    await asApp('UPDATE memberships SET owner = true WHERE admin_id = $1', [second]);
    const [a, b] = [new pg.Client(database().appUrl), new pg.Client(database().appUrl)];
    await Promise.all([a.connect(), b.connect()]);

    try {
      await a.query('BEGIN');
      await b.query('BEGIN');
      await a.query('UPDATE memberships SET owner = false WHERE admin_id = $1', [second]);
      await b.query('UPDATE memberships SET owner = false WHERE admin_id = $1', [first]);

      const outcomes = await Promise.allSettled([a.query('COMMIT'), b.query('COMMIT')]);

      expect(outcomes.map(({ status }) => status).toSorted()).toEqual(['fulfilled', 'rejected']);
      expect(await owners()).toHaveLength(1);
    } finally {
      await Promise.all([a.end(), b.end()]);
    }
  });

  it('removes the memberships with the Organisation itself', async () => {
    await asApp('DELETE FROM organisations WHERE id = $1', [organisationId]);

    expect(await owners()).toEqual([]);
  });
});
