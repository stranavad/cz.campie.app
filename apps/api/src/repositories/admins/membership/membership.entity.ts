import type { InferSelectModel } from 'drizzle-orm';

import type { Permissions } from '@repo/schema/admins';

import type { memberships } from '../../../db/schema.ts';

export type MembershipSelectModel = InferSelectModel<typeof memberships>;

/**
 * Read the level per area from a row holding the permission columns.
 * @param row a membership or invitation row
 */
export function permissionsOf(row: Permissions): Permissions {
  return {
    registrations: row.registrations,
    campSettings: row.campSettings,
    health: row.health,
    oddily: row.oddily,
    vedouci: row.vedouci,
  };
}

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
    this.permissions = permissionsOf(row);
  }
}
