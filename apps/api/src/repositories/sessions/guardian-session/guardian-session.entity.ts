import type { InferSelectModel } from 'drizzle-orm';

import type { guardianSessions } from '../../../db/schema.ts';

export type GuardianSessionSelectModel = InferSelectModel<typeof guardianSessions>;

export class GuardianSessionEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly email: string;
  public readonly expiresAt: Date;

  constructor(row: GuardianSessionSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.email = row.email;
    this.expiresAt = row.expiresAt;
  }
}
