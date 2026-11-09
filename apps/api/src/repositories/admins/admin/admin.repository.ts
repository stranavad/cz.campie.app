import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull, notExists } from 'drizzle-orm';

import type { Person } from '@repo/schema/shared';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { admins, legalAcceptances, memberships, operators } from '../../../db/schema.ts';
import { AdminEntity, type AdminInsertModel } from './admin.entity.ts';

export type CreateAdmin = Omit<AdminInsertModel, 'id'>;
export type UpdateAdmin = Partial<CreateAdmin>;

@Injectable()
export class AdminRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Get an admin by id, or throw if missing.
   * @param id admin id
   * @throws {NotFoundException} when no admin has this id
   */
  public async getByIdOrThrow(id: string): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.select().from(admins).where(eq(admins.id, id));

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new AdminEntity(row);
  }

  /**
   * Get the admin an email belongs to.
   * @param email the email, lowercase
   */
  public async getByEmail(email: string): Promise<AdminEntity | null> {
    const [row] = await this.unitOfWork.db.select().from(admins).where(eq(admins.email, email));

    return row === undefined ? null : new AdminEntity(row);
  }

  /**
   * Get the id and password hash of the admin an email belongs to, in one query, for the login only: the
   * hash stays out of the entity so no other caller holds it.
   * @param email the email, lowercase
   */
  public async getCredentialsByEmail(email: string): Promise<{ id: string; passwordHash: string | null } | null> {
    const [row] = await this.unitOfWork.db
      .select({ id: admins.id, passwordHash: admins.passwordHash })
      .from(admins)
      .where(eq(admins.email, email));

    return row ?? null;
  }

  /**
   * List admins by their email and name, in one query.
   * @param ids admin ids
   * @returns each admin by id; an unknown id is missing
   */
  public async listPeopleByIds(ids: readonly string[]): Promise<Map<string, Person>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.unitOfWork.db
      .select({ id: admins.id, email: admins.email, firstName: admins.firstName, lastName: admins.lastName })
      .from(admins)
      .where(inArray(admins.id, [...ids]));

    return new Map(rows.map(({ id, ...person }) => [id, person]));
  }

  /**
   * Create an admin identity.
   * @param input the admin
   * @throws {Error} when the database returns no row
   */
  public async create(input: CreateAdmin): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.insert(admins).values(input).returning();

    if (row === undefined) {
      throw new Error('The admin was not created');
    }

    return new AdminEntity(row);
  }

  /**
   * Update an admin identity.
   * @param id admin id
   * @param input the changed fields
   * @throws {NotFoundException} when no admin has this id
   */
  public async update(id: string, input: UpdateAdmin): Promise<AdminEntity> {
    const [row] = await this.unitOfWork.db.update(admins).set(input).where(eq(admins.id, id)).returning();

    if (row === undefined) {
      throw new NotFoundException();
    }

    return new AdminEntity(row);
  }

  /**
   * Mark an admin's email verified, unless it already is: of two simultaneous calls only one does.
   * @param id admin id
   * @param at when it was verified
   * @returns the admin as verified by this call, or null when it was verified already or is missing
   */
  public async verifyEmail(id: string, at: Date): Promise<AdminEntity | null> {
    const [row] = await this.unitOfWork.db
      .update(admins)
      .set({ emailVerifiedAt: at })
      .where(and(eq(admins.id, id), isNull(admins.emailVerifiedAt)))
      .returning();

    return row === undefined ? null : new AdminEntity(row);
  }

  /**
   * Remove those of the given admins who are left without any membership, are not the Platform operator
   * and never accepted another Organisation's legal texts, which keep naming them: such as the signer of a
   * rejected Organisation, so their email is free again.
   * @param ids admin ids
   * @returns the ids of the admins removed
   */
  public async removeWithoutMembership(ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.unitOfWork.db
      .delete(admins)
      .where(
        and(
          inArray(admins.id, [...ids]),
          notExists(this.unitOfWork.db.select().from(memberships).where(eq(memberships.adminId, admins.id))),
          notExists(this.unitOfWork.db.select().from(operators).where(eq(operators.adminId, admins.id))),
          notExists(
            this.unitOfWork.db.select().from(legalAcceptances).where(eq(legalAcceptances.acceptedBy, admins.id)),
          ),
        ),
      )
      .returning({ id: admins.id });

    return rows.map(({ id }) => id);
  }
}
