import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, notExists } from 'drizzle-orm';

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
