import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, lt } from 'drizzle-orm';

import type { Permissions } from '@repo/schema/admins';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { invitations } from '../../../db/schema.ts';
import { InvitationEntity } from './invitation.entity.ts';

// Invitations are a platform table without row-level security, so every method but the lookup by token
// keeps to the current Organisation itself.
@Injectable()
export class InvitationRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List the current Organisation's invitations, oldest first.
   */
  public async list(): Promise<InvitationEntity[]> {
    const rows = await this.unitOfWork.db
      .select()
      .from(invitations)
      .where(eq(invitations.organisationId, this.unitOfWork.organisationId))
      .orderBy(asc(invitations.id));

    return rows.map((row) => new InvitationEntity(row));
  }

  /**
   * Get an invitation of the current Organisation by id.
   * @param id invitation id
   */
  public async getById(id: string): Promise<InvitationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(invitations).where(this.inOrganisation(id));

    return row === undefined ? null : new InvitationEntity(row);
  }

  /**
   * Get the current Organisation's invitation of an email.
   * @param email the email, lowercase
   */
  public async getByEmail(email: string): Promise<InvitationEntity | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(invitations)
      .where(and(eq(invitations.organisationId, this.unitOfWork.organisationId), eq(invitations.email, email)));

    return row === undefined ? null : new InvitationEntity(row);
  }

  /**
   * Get an invitation of any Organisation by the hash of its link's token.
   * @param tokenHash SHA-256 of the token from the link
   */
  public async getByTokenHash(tokenHash: Buffer): Promise<InvitationEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(invitations).where(eq(invitations.tokenHash, tokenHash));

    return row === undefined ? null : new InvitationEntity(row);
  }

  /**
   * Create an invitation to the current Organisation, without a link yet.
   * @param input the email, the levels, who sends it, when, and the expiry
   * @throws {Error} when the database returns no row
   */
  public async create({
    permissions,
    ...input
  }: {
    email: string;
    permissions: Permissions;
    invitedByAdminId: string | null;
    sentAt: Date;
    expiresAt: Date;
  }): Promise<InvitationEntity> {
    const [row] = await this.unitOfWork.db
      .insert(invitations)
      .values({ organisationId: this.unitOfWork.organisationId, ...input, ...permissions })
      .returning();

    if (row === undefined) {
      throw new Error('The invitation was not created');
    }

    return new InvitationEntity(row);
  }

  /**
   * Update an invitation of the current Organisation.
   * @param id invitation id
   * @param input the levels, the hash of a new link's token (null for none yet), who sends it, when, and the
   * expiry
   * @throws {NotFoundException} when the current Organisation has no invitation with this id
   */
  public async update(
    id: string,
    {
      permissions,
      ...input
    }: {
      permissions?: Permissions;
      tokenHash?: Buffer | null;
      invitedByAdminId?: string | null;
      sentAt?: Date;
      expiresAt?: Date;
    },
  ): Promise<InvitationEntity> {
    const [row] = await this.unitOfWork.db
      .update(invitations)
      .set({ ...input, ...permissions })
      .where(this.inOrganisation(id))
      .returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new InvitationEntity(row);
  }

  /**
   * Remove an invitation of the current Organisation.
   * @param id invitation id
   * @throws {NotFoundException} when the current Organisation has no invitation with this id
   */
  public async remove(id: string): Promise<void> {
    const rows = await this.unitOfWork.db
      .delete(invitations)
      .where(this.inOrganisation(id))
      .returning({ id: invitations.id });

    if (rows.length === 0) {
      throw new NotFoundException();
    }
  }

  /**
   * Use up the invitation of any Organisation that a link's token still opens, by removing it, and return
   * it as removed. Matching the token, not only the id, means a link replaced or revoked meanwhile opens
   * nothing; of two simultaneous calls only one gets the row, so a link works once.
   * @param tokenHash SHA-256 of the token from the link
   */
  public async consumeByTokenHash(tokenHash: Buffer): Promise<InvitationEntity | null> {
    const [row] = await this.unitOfWork.db.delete(invitations).where(eq(invitations.tokenHash, tokenHash)).returning();

    return row === undefined ? null : new InvitationEntity(row);
  }

  /**
   * Match the invitation with an id only within the current Organisation.
   * @param id invitation id
   */
  private inOrganisation(id: string) {
    return and(eq(invitations.id, id), eq(invitations.organisationId, this.unitOfWork.organisationId));
  }

  /**
   * Remove the invitations of every Organisation that expired before an instant, for housekeeping.
   * @param before the instant
   * @returns how many were removed
   */
  public async removeAllExpired(before: Date): Promise<number> {
    const removed = await this.unitOfWork.db
      .delete(invitations)
      .where(lt(invitations.expiresAt, before))
      .returning({ id: invitations.id });

    return removed.length;
  }
}
