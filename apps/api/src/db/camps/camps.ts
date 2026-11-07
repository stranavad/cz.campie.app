import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const camps = p.snakeCase.table.withRLS(
  'camps',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    name: p.text().notNull(),
    slug: p.text().notNull(),
    accentColour: p.text(),
    // No foreign key to files, as on organisations: the logo is replaced or removed through the Camp.
    logoFileId: p.uuid(),
  },
  // The colour is written into pages', emails' and documents' CSS; anything but a hex colour could carry more CSS.
  (table) => [
    p.unique().on(table.organisationId, table.slug),
    p.check('camps_accent_colour_hex', sql`${table.accentColour} ~ '^#[0-9a-f]{6}$'`),
    organisationPolicy(),
  ],
);
