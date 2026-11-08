import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { emailVerifications } from '../../../db/schema.ts';

export type EmailVerificationSelectModel = InferSelectModel<typeof emailVerifications>;
export type EmailVerificationInsertModel = InferInsertModel<typeof emailVerifications>;

export class EmailVerificationEntity {
  public readonly id: string;
  public readonly adminId: string;
  public readonly organisationId: string;
  public readonly expiresAt: Date;

  constructor(row: EmailVerificationSelectModel) {
    this.id = row.id;
    this.adminId = row.adminId;
    this.organisationId = row.organisationId;
    this.expiresAt = row.expiresAt;
  }
}
