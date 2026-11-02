import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { admins } from '../../../db/schema.ts';

export type AdminSelectModel = InferSelectModel<typeof admins>;
export type AdminInsertModel = InferInsertModel<typeof admins>;

// The password hash stays in the row: no caller outside the login needs it.
export class AdminEntity {
  public readonly id: string;
  public readonly email: string;

  constructor(row: AdminSelectModel) {
    this.id = row.id;
    this.email = row.email;
  }
}
