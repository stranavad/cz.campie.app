import { getTableName } from 'drizzle-orm';

import { organisationKeys } from './organisations/organisation-keys.ts';
import { organisations } from './organisations/organisations.ts';

// The only tables without the organisation policy: they hold records above any one Organisation. Every
// unit of work reaches them, so their services decide who may read or change what.
export const PLATFORM_TABLES: readonly string[] = [organisations, organisationKeys].map((table) => getTableName(table));
