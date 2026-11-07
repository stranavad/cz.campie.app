import * as p from 'drizzle-orm/pg-core';

import { camps } from '../camps/camps.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

// A named choice of export columns for a Camp, shared by the Organisation's admins.
export const exportPresets = p.snakeCase.table.withRLS(
  'export_presets',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    name: p.text().notNull(),
    columns: p.jsonb().$type<string[]>().notNull(),
    createdByAdminId: p.uuid().notNull(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'export_presets_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('export_presets_camp_id_idx').on(table.campId),
    organisationPolicy(),
  ],
);

// An admin's last choice of export columns for a Camp.
export const exportSelections = p.snakeCase.table.withRLS(
  'export_selections',
  {
    organisationId: organisationId(),
    adminId: p.uuid().notNull(),
    campId: p.uuid().notNull(),
    columns: p.jsonb().$type<string[]>().notNull(),
    updatedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'export_selections_pkey', columns: [table.organisationId, table.adminId, table.campId] }),
    p
      .foreignKey({
        name: 'export_selections_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
