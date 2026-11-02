import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import type { Account } from '@repo/schema/admins';

import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { memberships, organisations } from '../../../../db/schema.ts';
import { AdminService } from '../../admin/services/admin.service.ts';

@Injectable()
export class AccountService {
  constructor(
    private readonly admins: AdminService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Get an admin's own account: their email and the Organisations they are a member of, with each one's
   * status. Reads platform tables only, so it runs in a platform unit of work.
   * @param adminId the signed-in admin
   */
  public async get(adminId: string): Promise<Account> {
    const admin = await this.admins.getByIdOrThrow(adminId);

    const rows = await this.unitOfWork.db
      .select({
        owner: memberships.owner,
        id: organisations.id,
        displayName: organisations.displayName,
        subdomain: organisations.subdomain,
        status: organisations.status,
      })
      .from(memberships)
      .innerJoin(organisations, eq(organisations.id, memberships.organisationId))
      .where(eq(memberships.adminId, adminId))
      .orderBy(asc(memberships.id));

    return {
      email: admin.email,
      memberships: rows.map(({ owner, ...organisation }) => ({ owner, organisation })),
    };
  }
}
