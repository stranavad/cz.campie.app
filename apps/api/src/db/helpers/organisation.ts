import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

// The role the API connects as. It owns no tables and cannot bypass row-level security; a migration
// creates it, provisioning gives it a login and password.
export const appRole = p.pgRole('campie_app').existing();

// The transaction-local setting a unit of work stores the current Organisation in.
export const ORGANISATION_SETTING = 'app.organisation_id';

export const POLICY_NAME = 'organisation_isolation';

export const organisationId = () => p.uuid().notNull();

// A setting never set reads as NULL, but after a transaction that set it locally the connection reads
// it as '', so both mean "no Organisation" and match no row.
const currentOrganisation = sql`organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid`;

// Admits only the current Organisation's rows, for reads and writes alike.
export const organisationPolicy = () =>
  p.pgPolicy(POLICY_NAME, {
    as: 'permissive',
    for: 'all',
    to: appRole,
    using: currentOrganisation,
    withCheck: currentOrganisation,
  });
