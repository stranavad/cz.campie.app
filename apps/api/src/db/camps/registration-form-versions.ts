import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import type { Declaration } from '@repo/schema/camps';
import type { FormDefinition } from '@repo/schema/form-engine';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

export const registrationFormVersions = p.snakeCase.table.withRLS(
  'registration_form_versions',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    version: p.integer().notNull(),
    definition: p.jsonb().$type<FormDefinition>().notNull(),
    maxParticipants: p.integer().notNull(),
    declarations: p.jsonb().$type<Declaration[]>().notNull().default([]),
    publishedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('registration_form_versions_organisation_id_id_key').on(table.organisationId, table.id),
    p.unique('registration_form_versions_camp_id_version_key').on(table.campId, table.version),
    p
      .foreignKey({
        name: 'registration_form_versions_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.check('registration_form_versions_version', sql`${table.version} >= 1`),
    organisationPolicy(),
  ],
);
