import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { CAMP_MODULES } from '@repo/schema/camps';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const campModule = p.pgEnum('camp_module', CAMP_MODULES);

export const camps = p.snakeCase.table.withRLS(
  'camps',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    name: p.text().notNull(),
    slug: p.text().notNull(),
    websiteUrl: p.text(),
    contactName: p.text(),
    contactEmail: p.text(),
    contactPhone: p.text(),
    modules: campModule()
      .array()
      .notNull()
      .default(sql`'{}'`),
    accentColour: p.text(),
    // No foreign key to files, as on organisations: the logo is replaced or removed through the Camp.
    logoFileId: p.uuid(),
  },
  // A slug is unique within the Organisation through camp_slugs, which holds former ones too. The colour is
  // written into pages', emails' and documents' CSS; anything but a hex colour could carry more CSS.
  (table) => [
    p.unique('camps_organisation_id_id_key').on(table.organisationId, table.id),
    p.check('camps_accent_colour_hex', sql`${table.accentColour} ~ '^#[0-9a-f]{6}$'`),
    organisationPolicy(),
  ],
);
