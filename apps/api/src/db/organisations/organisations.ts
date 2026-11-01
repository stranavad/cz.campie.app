import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';

export const organisations = p.snakeCase.table('organisations', {
  id: id(),
  subdomain: p.text().notNull().unique(),
});
