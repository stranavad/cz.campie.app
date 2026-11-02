import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { passwordResets } from '../../../db/schema.ts';

export type PasswordResetSelectModel = InferSelectModel<typeof passwordResets>;
export type PasswordResetInsertModel = InferInsertModel<typeof passwordResets>;

export class PasswordResetEntity {
  public readonly id: string;
  public readonly adminId: string;
  public readonly expiresAt: Date;

  constructor(row: PasswordResetSelectModel) {
    this.id = row.id;
    this.adminId = row.adminId;
    this.expiresAt = row.expiresAt;
  }
}
