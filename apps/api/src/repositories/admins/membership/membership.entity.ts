import type { InferSelectModel } from 'drizzle-orm';

import type { memberships } from '../../../db/schema.ts';

export type MembershipSelectModel = InferSelectModel<typeof memberships>;

export class MembershipEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly adminId: string;

  constructor(row: MembershipSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.adminId = row.adminId;
  }
}
