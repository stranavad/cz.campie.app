import * as p from 'drizzle-orm/pg-core';

import { PERMISSION_LEVELS } from '@repo/schema/admins';

import { id } from '../helpers/ids.ts';
import { organisations } from '../organisations/organisations.ts';
import { admins } from './admins.ts';

export const permissionLevel = p.pgEnum('permission_level', PERMISSION_LEVELS);

const level = () => permissionLevel().notNull().default('none');

// An Organisation always keeps an Owner: a deferred trigger refuses a commit that demotes or removes the
// last one, unless the Organisation itself is gone.
export const memberships = p.snakeCase.table(
  'memberships',
  {
    id: id(),
    organisationId: p
      .uuid()
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    adminId: p
      .uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    owner: p.boolean().notNull().default(false),
    registrations: level(),
    campSettings: level(),
    health: level(),
    oddily: level(),
    vedouci: level(),
  },
  (table) => [p.unique().on(table.organisationId, table.adminId)],
);
