import { describe, expect, it } from 'vitest';

import { createAdmin, createOrganisation } from '../../testing/fixtures.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { housekeepingJob } from './housekeeping.jobs.ts';

const DAY = 24 * 60 * 60 * 1000;
const TOKEN = `decode(md5(random()::text), 'hex')`;

describe('housekeeping', () => {
  const { app, clock, database, jobs } = useTestApp();

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const expiries = async (table: string) =>
    (await query<{ expires_at: Date }>(`SELECT expires_at FROM ${table} ORDER BY expires_at`)).map(({ expires_at }) =>
      expires_at.toISOString(),
    );
  const runHousekeeping = async () => {
    await jobs().due(housekeepingJob);

    return jobs().drain();
  };

  it('removes login data a day past its expiry and invitations a month past, in every Organisation', async () => {
    const organisations = [await createOrganisation(app()), await createOrganisation(app())];
    const admin = await createAdmin(app(), { memberOf: [] });
    await query('DELETE FROM admin_sessions');
    const now = clock().now().getTime();
    const at = (offset: number) => new Date(now + offset).toISOString();

    for (const expiresAt of [at(-DAY - 1), at(-DAY + 1)]) {
      await query(`INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES ($1, ${TOKEN}, $2)`, [
        admin.id,
        expiresAt,
      ]);
      await query(`INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES ($1, ${TOKEN}, $2)`, [
        admin.id,
        expiresAt,
      ]);

      for (const organisationId of organisations) {
        for (const table of ['guardian_sessions', 'guardian_login_links']) {
          await query(
            `INSERT INTO ${table} (organisation_id, email, token_hash, expires_at) VALUES ($1, 'rodic@example.com', ${TOKEN}, $2)`,
            [organisationId, expiresAt],
          );
        }
      }
    }

    for (const [email, expiresAt] of [
      ['stara@example.com', at(-30 * DAY - 1)],
      ['nedavna@example.com', at(-30 * DAY + 1)],
    ]) {
      await query('INSERT INTO invitations (organisation_id, email, expires_at) VALUES ($1, $2, $3)', [
        organisations[0],
        email,
        expiresAt,
      ]);
    }

    for (const organisationId of organisations) {
      await query(`INSERT INTO guardian_login_requests (organisation_id, email) VALUES ($1, 'rodic@example.com')`, [
        organisationId,
      ]);
    }

    expect(await runHousekeeping()).toEqual([
      { job: housekeepingJob.name, outcome: 'completed' },
      { job: 'housekeeping.organisation', outcome: 'completed' },
      { job: 'housekeeping.organisation', outcome: 'completed' },
    ]);

    expect(await expiries('admin_sessions')).toEqual([at(-DAY + 1)]);
    expect(await expiries('password_resets')).toEqual([at(-DAY + 1)]);
    expect(await expiries('guardian_sessions')).toEqual([at(-DAY + 1), at(-DAY + 1)]);
    expect(await expiries('guardian_login_links')).toEqual([at(-DAY + 1), at(-DAY + 1)]);
    expect(await query('SELECT email FROM invitations')).toEqual([{ email: 'nedavna@example.com' }]);
    expect(await query('SELECT FROM guardian_login_requests')).toHaveLength(2);

    clock().advance(DAY + 60_000);
    await runHousekeeping();

    expect(await query('SELECT FROM guardian_login_requests')).toEqual([]);
    expect(await expiries('guardian_sessions')).toEqual([]);
  });
});
