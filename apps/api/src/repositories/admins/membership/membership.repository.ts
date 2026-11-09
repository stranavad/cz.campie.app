import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, getColumns, ne, sql } from 'drizzle-orm';

import type { Permissions } from '@repo/schema/admins';

import { violatedConstraint } from '../../../core/database/constraint-violation.ts';
import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { admins, memberships, totpCredentials } from '../../../db/schema.ts';
import { MemberEntity } from '../member/member.entity.ts';
import { MembershipEntity } from './membership.entity.ts';

// The deferred trigger that refuses to commit an Organisation without an Owner.
const KEEP_AN_OWNER = 'memberships_keep_an_owner';

// Memberships are a platform table without row-level security, so every method working on the current
// Organisation's members keeps to it itself.
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
   * Tell whether an admin is a member of any Organisation besides the current one; the one query of a
   * member that looks past the current Organisation, so a reset there does not weaken another.
   * @param adminId admin id
   */
  public async belongsElsewhere(adminId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.adminId, adminId), ne(memberships.organisationId, this.unitOfWork.organisationId)))
      .limit(1);

    return row !== undefined;
  }

  /**
   * List the ids of the admins who are members of an Organisation, for the operator console, which has no
   * current Organisation.
   * @param organisationId Organisation id
   */
  public async listAdminIdsByOrganisation(organisationId: string): Promise<string[]> {
    const rows = await this.unitOfWork.db
      .select({ adminId: memberships.adminId })
      .from(memberships)
      .where(eq(memberships.organisationId, organisationId));

    return rows.map(({ adminId }) => adminId);
  }

  /**
   * List the current Organisation's members with their emails and names, in the order they joined.
   */
  public async listMembers(): Promise<MemberEntity[]> {
    const rows = await this.selectMembers()
      .where(eq(memberships.organisationId, this.unitOfWork.organisationId))
      .orderBy(asc(memberships.id));

    return rows.map((row) => new MemberEntity(row));
  }

  /**
   * Get a member of the current Organisation by their membership's id, or throw if missing.
   * @param id membership id
   * @throws {NotFoundException} when the current Organisation has no membership with this id
   */
  public async getMemberByIdOrThrow(id: string): Promise<MemberEntity> {
    const [row] = await this.selectMembers().where(this.inOrganisation(id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new MemberEntity(row);
  }

  /**
   * List the admin ids of the current Organisation's Owners.
   */
  public async listOwnerIds(): Promise<string[]> {
    const rows = await this.unitOfWork.db
      .select({ adminId: memberships.adminId })
      .from(memberships)
      .where(and(eq(memberships.organisationId, this.unitOfWork.organisationId), eq(memberships.owner, true)))
      .orderBy(asc(memberships.id));

    return rows.map(({ adminId }) => adminId);
  }

  /**
   * Create a membership of an admin in the current Organisation; an area left out is none.
   * @param input the admin, whether they are an Owner, and their level per area
   * @throws {Error} when the database returns no row
   */
  public async create({
    permissions,
    ...input
  }: {
    adminId: string;
    owner: boolean;
    permissions?: Partial<Permissions>;
  }): Promise<MembershipEntity> {
    const [row] = await this.unitOfWork.db
      .insert(memberships)
      .values({ organisationId: this.unitOfWork.organisationId, ...input, ...permissions })
      .returning();

    if (row === undefined) {
      throw new Error('The membership was not created');
    }

    return new MembershipEntity(row);
  }

  /**
   * Update a membership of the current Organisation.
   * @param id membership id
   * @param input whether the member is an Owner, and their level per area
   * @throws {NotFoundException} when the current Organisation has no membership with this id
   */
  public async update(
    id: string,
    { permissions, ...input }: { owner?: boolean; permissions?: Permissions },
  ): Promise<MembershipEntity> {
    const [row] = await this.unitOfWork.db
      .update(memberships)
      .set({ ...input, ...permissions })
      .where(this.inOrganisation(id))
      .returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new MembershipEntity(row);
  }

  /**
   * Remove a membership of the current Organisation.
   * @param id membership id
   * @throws {NotFoundException} when the current Organisation has no membership with this id
   */
  public async remove(id: string): Promise<void> {
    const rows = await this.unitOfWork.db
      .delete(memberships)
      .where(this.inOrganisation(id))
      .returning({ id: memberships.id });

    if (rows.length === 0) {
      throw new NotFoundException();
    }
  }

  /**
   * Check now, rather than at commit, that every Organisation the transaction's changes touched keeps an
   * Owner. On false the transaction can only roll back.
   */
  public async keepsAnOwner(): Promise<boolean> {
    try {
      await this.unitOfWork.db.execute(sql.raw(`SET CONSTRAINTS ${KEEP_AN_OWNER} IMMEDIATE`));

      return true;
    } catch (error) {
      if (violatedConstraint(error, 'check') === KEEP_AN_OWNER) {
        return false;
      }

      throw error;
    }
  }

  /**
   * Select memberships with their admin's email and name.
   */
  private selectMembers() {
    return this.unitOfWork.db
      .select({
        ...getColumns(memberships),
        email: admins.email,
        firstName: admins.firstName,
        lastName: admins.lastName,
        totpEnabled: sql<boolean>`${totpCredentials.confirmedAt} IS NOT NULL`,
      })
      .from(memberships)
      .innerJoin(admins, eq(admins.id, memberships.adminId))
      .leftJoin(totpCredentials, eq(totpCredentials.adminId, memberships.adminId))
      .$dynamic();
  }

  /**
   * Match the membership with an id only within the current Organisation.
   * @param id membership id
   */
  private inOrganisation(id: string) {
    return and(eq(memberships.id, id), eq(memberships.organisationId, this.unitOfWork.organisationId));
  }

  /**
   * Get the Turnus an admin last chose to look at in the current Organisation.
   * @param adminId admin id
   */
  public async getSelectedTurnusId(adminId: string): Promise<string | null> {
    const [row] = await this.unitOfWork.db
      .select({ turnusId: memberships.selectedTurnusId })
      .from(memberships)
      .where(and(eq(memberships.organisationId, this.unitOfWork.organisationId), eq(memberships.adminId, adminId)));

    return row?.turnusId ?? null;
  }

  /**
   * Remember the Turnus an admin chose to look at in the current Organisation.
   * @param adminId admin id
   * @param turnusId Turnus id
   */
  public async setSelectedTurnusId(adminId: string, turnusId: string): Promise<void> {
    await this.unitOfWork.db
      .update(memberships)
      .set({ selectedTurnusId: turnusId })
      .where(and(eq(memberships.organisationId, this.unitOfWork.organisationId), eq(memberships.adminId, adminId)));
  }
}
