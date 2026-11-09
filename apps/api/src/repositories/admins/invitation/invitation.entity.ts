import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { Invitation, Permissions } from '@repo/schema/admins';
import type { Person } from '@repo/schema/shared';

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
  public readonly sentAt: Date;
  public readonly expiresAt: Date;
  public readonly invitedByAdminId: string | null;

  constructor(row: InvitationSelectModel) {
    this.id = row.id;
    this.organisationId = row.organisationId;
    this.email = row.email;
    this.permissions = permissionsOf(row);
    this.sent = row.tokenHash !== null;
    this.sentAt = row.sentAt;
    this.expiresAt = row.expiresAt;
    this.invitedByAdminId = row.invitedByAdminId;
  }

  // The inviting Owner is another record, read beside the invitation, so the audit log never holds their name.
  toDto(invitedBy: Person | null): Invitation {
    return {
      id: this.id,
      email: this.email,
      permissions: this.permissions,
      sentAt: this.sentAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      invitedBy,
    };
  }
}
