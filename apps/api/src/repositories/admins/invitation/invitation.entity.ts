import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { Invitation, Permissions } from '@repo/schema/admins';

import type { invitations } from '../../../db/schema.ts';
import { permissionsOf } from '../membership/membership.entity.ts';

export type InvitationSelectModel = InferSelectModel<typeof invitations>;
export type InvitationInsertModel = InferInsertModel<typeof invitations>;

// The token's hash stays in the row: it only finds the invitation, nobody reads it.
export class InvitationEntity {
  public readonly id: string;
  public readonly organisationId: string;
  public readonly email: string;
  public readonly permissions: Permissions;
  // Whether the emailed link exists yet; until the job makes it, no token opens the invitation.
  public readonly sent: boolean;
  public readonly expiresAt: Date;

  constructor(row: InvitationSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.email = row.email;
    this.permissions = permissionsOf(row);
    this.sent = row.tokenHash !== null;
    this.expiresAt = row.expiresAt;
  }

  toDto(): Invitation {
    return {
      id: this.id,
      email: this.email,
      permissions: this.permissions,
      expiresAt: this.expiresAt.toISOString(),
    };
  }
}
