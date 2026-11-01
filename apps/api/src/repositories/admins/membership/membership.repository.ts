import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { memberships } from '../../../db/schema.ts';
import { MembershipEntity } from './membership.entity.ts';

@Injectable()
export class MembershipRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an admin's membership in an Organisation.
   * @param organisationId Organisation id
   * @param adminId admin id
   */
  public async getByOrganisationAndAdmin(organisationId: string, adminId: string): Promise<MembershipEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(memberships)
      .where(and(eq(memberships.organisationId, organisationId), eq(memberships.adminId, adminId)));

    return row === undefined ? null : new MembershipEntity(row);
  }

  /**
   * Create a membership of an admin in the current Organisation.
   * @param adminId admin id
   * @throws {Error} when the database returns no row
   */
  public async create(adminId: string): Promise<MembershipEntity> {
    const [row] = await this.unitOfWork.db
      .insert(memberships)
      .values({ organisationId: this.unitOfWork.organisationId, adminId })
      .returning();

    if (row === undefined) {
      throw new Error('The membership was not created');
    }

    return new MembershipEntity(row);
  }
}
