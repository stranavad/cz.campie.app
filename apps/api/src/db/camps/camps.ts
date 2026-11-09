import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { CAMP_MODULES } from '@repo/schema/camps';
import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const campModule = p.pgEnum('camp_module', CAMP_MODULES);
export const siblingDiscountMode = p.pgEnum('sibling_discount_mode', SIBLING_DISCOUNT_MODES);

export const camps = p.snakeCase.table.withRLS(
  'camps',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    name: p.text().notNull(),
    slug: p.text().notNull(),
    websiteUrl: p.text(),
    description: p.text(),
    contactName: p.text(),
    contactEmail: p.text(),
    contactPhone: p.text(),
    modules: campModule()
      .array()
      .notNull()
      .default(sql`'{}'`),
    siblingDiscountAmount: p.integer().notNull().default(0),
    siblingDiscountAppliesTo: siblingDiscountMode().notNull().default('every_child'),
    notificationEmails: p
      .text()
      .array()
      .notNull()
      .default(sql`'{}'`),
    contactEditLockDate: p.date({ mode: 'string' }),
    accentColour: p.text(),
    // No foreign key to files, as on organisations: the logo and photo are replaced or removed through the Camp.
    logoFileId: p.uuid(),
    photoFileId: p.uuid(),
  },
  // A slug is unique within the Organisation through camp_slugs, which holds former ones too. The colour is
  // written into pages', emails' and documents' CSS; anything but a hex colour could carry more CSS.
  (table) => [
    p.unique('camps_organisation_id_id_key').on(table.organisationId, table.id),
    p.check('camps_sibling_discount_amount', sql`${table.siblingDiscountAmount} >= 0`),
    p.check('camps_accent_colour_hex', sql`${table.accentColour} ~ '^#[0-9a-f]{6}$'`),
    organisationPolicy(),
  ],
);
