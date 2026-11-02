import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';

export const organisations = p.snakeCase.table(
  'organisations',
  {
    id: id(),
    subdomain: p.text().notNull().unique(),
    legalName: p.text().notNull(),
    ico: p.text().notNull(),
    address: p.text().notNull(),
    displayName: p.text().notNull(),
    accentColour: p.text().notNull().default('#2b8a4e'),
    // No foreign key to files: files reference organisations, and the reverse would be an import cycle
    // between the two schema files. The logo is replaced or removed through the Organisation, which clears it.
    logoFileId: p.uuid(),
  },
  // The colour is written into documents' and pages' CSS; anything but a hex colour could carry more CSS.
  (table) => [p.check('organisations_accent_colour_hex', sql`${table.accentColour} ~ '^#[0-9a-f]{6}$'`)],
);
