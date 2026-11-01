import { Injectable } from '@nestjs/common';

import type { MembershipEntity } from '../../../../repositories/admins/membership/membership.entity.ts';
import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';

@Injectable()
export class MembershipService {
  constructor(private readonly memberships: MembershipRepository) {}

  /**
   * Make an admin a member of the current Organisation.
   * @param adminId admin id
   */
  public create(adminId: string): Promise<MembershipEntity> {
    return this.memberships.create(adminId);
  }
}
