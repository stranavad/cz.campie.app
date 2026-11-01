import type pg from 'pg';

import { appRole, POLICY_NAME } from '../db/helpers/organisation.ts';
import { PLATFORM_TABLES } from '../db/platform-tables.ts';

// The organisation policy's expression as PostgreSQL prints it back.
const ORGANISATION_EXPRESSION =
  "(organisation_id = (NULLIF(current_setting('app.organisation_id'::text, true), ''::text))::uuid)";

interface Policy {
  name: string;
  cmd: string;
  roles: string[];
  using: string | null;
  check: string | null;
}

interface TableRow {
  table: string;
  // r: table, p: partitioned table, v: view, m: materialized view
  kind: 'r' | 'p' | 'v' | 'm';
  invoker: boolean;
  rls: boolean;
  scoped: boolean;
  policies: Policy[];
}

// Tables and views of every schema but PostgreSQL's own and drizzle's migration journal, with what
// tenancy needs.
const TABLES = `
  SELECT
    CASE WHEN n.nspname = 'public' THEN c.relname ELSE n.nspname || '.' || c.relname END AS table,
    c.relkind AS kind,
    EXISTS (
      SELECT FROM pg_options_to_table(c.reloptions) o
      WHERE o.option_name = 'security_invoker' AND o.option_value IN ('true', 'on', 'yes', '1')
    ) AS invoker,
    c.relrowsecurity AS rls,
    EXISTS (
      SELECT FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'organisation_id' AND a.atttypid = 'uuid'::regtype
        AND a.attnotnull AND NOT a.attisdropped
    ) AS scoped,
    COALESCE((
      SELECT json_agg(json_build_object(
        'name', p.policyname, 'cmd', p.cmd, 'roles', p.roles, 'using', p.qual, 'check', p.with_check))
      FROM pg_policies p
      WHERE p.schemaname = n.nspname AND p.tablename = c.relname AND p.permissive = 'PERMISSIVE'
    ), '[]') AS policies
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'v', 'm')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'drizzle') AND n.nspname NOT LIKE 'pg\\_%'
  ORDER BY 1`;

// Permissive policies are OR-ed, so any second one would widen what the organisation policy admits.
function isOnlyOrganisationPolicy(policies: Policy[]): boolean {
  const [policy, ...others] = policies;

  return (
    policy !== undefined &&
    others.length === 0 &&
    policy.name === POLICY_NAME &&
    policy.cmd === 'ALL' &&
    policy.roles.length === 1 &&
    policy.roles[0] === appRole.name &&
    policy.using === ORGANISATION_EXPRESSION &&
    policy.check === ORGANISATION_EXPRESSION
  );
}

/**
 * List every table that is neither Organisation-scoped nor on the platform list, every view that gets
 * past row-level security, and every stale entry of that list, as one message each.
 * @param client a connection to the migrated database
 */
export async function findTenancyViolations(client: pg.Client): Promise<string[]> {
  const { rows } = await client.query<TableRow>(TABLES);
  const violations: string[] = [];

  for (const { table, kind, invoker, rls, scoped, policies } of rows) {
    if (PLATFORM_TABLES.includes(table)) {
      continue;
    }

    // A view reads its tables as the view's owner, who is not subject to row-level security, unless it
    // is declared security_invoker; a materialized view holds a copy no policy applies to.
    if (kind === 'v') {
      if (!invoker) {
        violations.push(
          `${table}: is a view that reads as its owner, past row-level security; declare it with security_invoker`,
        );
      }

      continue;
    }

    if (kind === 'm') {
      violations.push(`${table}: is a materialized view, which row-level security cannot reach`);

      continue;
    }

    if (!scoped) {
      violations.push(`${table}: has no NOT NULL uuid organisation_id column`);
    }

    if (!rls) {
      violations.push(`${table}: has row-level security off`);
    }

    if (!isOnlyOrganisationPolicy(policies)) {
      violations.push(
        `${table}: needs exactly one permissive policy, ${POLICY_NAME} for all commands to ${appRole.name}, admitting only the current Organisation`,
      );
    }
  }

  for (const table of PLATFORM_TABLES) {
    if (!rows.some((row) => row.table === table)) {
      violations.push(`${table}: is on the platform list but does not exist`);
    }
  }

  return violations;
}
