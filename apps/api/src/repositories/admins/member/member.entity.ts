import type { Member } from '@repo/schema/admins';

import { MembershipEntity, type MembershipSelectModel } from '../membership/membership.entity.ts';

// A membership with the email and name of its admin, as Owners manage it.
export class MemberEntity extends MembershipEntity {
  public readonly email: string;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly totpEnabled: boolean;

  constructor(
    row: MembershipSelectModel & {
      email: string;
      firstName: string | null;
      lastName: string | null;
      totpEnabled: boolean;
    },
  ) {
    super(row);
    this.email = row.email;
    this.firstName = row.firstName;
    this.lastName = row.lastName;
    this.totpEnabled = row.totpEnabled;
  }

  toDto(): Member {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      owner: this.owner,
      permissions: this.permissions,
      totpEnabled: this.totpEnabled,
    };
  }
}
