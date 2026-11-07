import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import type { ConsentItem } from '@repo/schema/consents';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { consents } from './consents.ts';

// A published version is never changed: what was signed on it stays provable.
export const consentVersions = p.snakeCase.table.withRLS(
  'consent_versions',
  {
    id: id(),
    organisationId: organisationId(),
    consentId: p.uuid().notNull(),
    version: p.integer().notNull(),
    title: p.text().notNull(),
    introduction: p.text().notNull(),
    items: p.jsonb().$type<ConsentItem[]>().notNull(),
    withdrawable: p.boolean().notNull(),
    fileId: p.uuid(),
    fileSha256: p.text(),
    publishedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('consent_versions_organisation_id_id_key').on(table.organisationId, table.id),
    p.unique('consent_versions_consent_id_version_key').on(table.consentId, table.version),
    p
      .foreignKey({
        name: 'consent_versions_consents_fkey',
        columns: [table.organisationId, table.consentId],
        foreignColumns: [consents.organisationId, consents.id],
      })
      .onDelete('cascade'),
    p.check('consent_versions_version', sql`${table.version} >= 1`),
    p.check('consent_versions_file', sql`(${table.fileId} IS NULL) = (${table.fileSha256} IS NULL)`),
    organisationPolicy(),
  ],
);
