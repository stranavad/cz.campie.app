import { Injectable } from '@nestjs/common';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import type { MembershipEntity } from '../../../../repositories/admins/membership/membership.entity.ts';
import { MembershipRepository } from '../../../../repositories/admins/membership/membership.repository.ts';

@Injectable()
export class MembershipService {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Make an admin a member of the current Organisation, audited.
   * @param actor who does it
   * @param input the admin and whether they become an Owner
   */
  public async create(actor: Actor, input: { adminId: string; owner: boolean }): Promise<MembershipEntity> {
    const membership = await this.memberships.create(input);

    await this.audit.record(actor, {
      action: 'membership.create',
      target: { type: 'membership', id: membership.id },
      change: { before: null, after: membership },
    });

    return membership;
  }
}
