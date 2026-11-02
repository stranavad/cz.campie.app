import type { InferSelectModel } from 'drizzle-orm';

import type { Permissions } from '@repo/schema/admins';

import type { memberships } from '../../../db/schema.ts';

export type MembershipSelectModel = InferSelectModel<typeof memberships>;

export class MembershipEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly adminId: string;
  public readonly owner: boolean;
  public readonly permissions: Permissions;

  constructor(row: MembershipSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.adminId = row.adminId;
    this.owner = row.owner;
    this.permissions = {
      registrations: row.registrations,
      campSettings: row.campSettings,
      health: row.health,
      oddily: row.oddily,
      vedouci: row.vedouci,
    };
  }
}
