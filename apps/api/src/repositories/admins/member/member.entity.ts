import type { Member } from '@repo/schema/admins';

import { MembershipEntity, type MembershipSelectModel } from '../membership/membership.entity.ts';

// A membership with the email of its admin, as Owners manage it.
export class MemberEntity extends MembershipEntity {
  public readonly email: string;

  constructor(row: MembershipSelectModel & { email: string }) {
    super(row);
    this.email = row.email;
  }

  toDto(): Member {
    return { id: this.id, email: this.email, owner: this.owner, permissions: this.permissions };
  }
}
