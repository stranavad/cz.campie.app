import * as p from 'drizzle-orm/pg-core';

import type { FormDefinition } from '@repo/schema/form-engine';

import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

// A Camp's draft registration form; a Camp without a row has the preset draft.
export const registrationForms = p.snakeCase.table.withRLS(
  'registration_forms',
  {
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    draft: p.jsonb().$type<FormDefinition>().notNull(),
    maxParticipants: p.integer().notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'registration_forms_pkey', columns: [table.organisationId, table.campId] }),
    p
      .foreignKey({
        name: 'registration_forms_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
