import type { Member } from '@repo/schema/admins';

import { MembershipEntity, type MembershipSelectModel } from '../membership/membership.entity.ts';

// A membership with the email of its admin, as Owners manage it.
export class MemberEntity extends MembershipEntity {
  public readonly email: string;
  public readonly totpEnabled: boolean;

  constructor(row: MembershipSelectModel & { email: string; totpEnabled: boolean }) {
    super(row);
    this.email = row.email;
    this.totpEnabled = row.totpEnabled;
  }

  toDto(): Member {
    return {
      id: this.id,
      email: this.email,
      owner: this.owner,
      permissions: this.permissions,
      totpEnabled: this.totpEnabled,
    };
  }
}
