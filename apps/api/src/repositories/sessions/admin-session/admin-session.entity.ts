import type { InferSelectModel } from 'drizzle-orm';

import type { adminSessions } from '../../../db/schema.ts';

export type AdminSessionSelectModel = InferSelectModel<typeof adminSessions>;

export class AdminSessionEntity {
  public readonly id: string;
  public readonly adminId: string;
  public readonly expiresAt: Date;
  public readonly secondFactor: boolean;

  constructor(row: AdminSessionSelectModel) {
    this.id = row.id;
    this.adminId = row.adminId;
    this.expiresAt = row.expiresAt;
    this.secondFactor = row.secondFactor;
  }
}
