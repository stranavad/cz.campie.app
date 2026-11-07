import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { supportGrants } from '../../../db/schema.ts';

export type SupportGrantRow = InferSelectModel<typeof supportGrants>;

// A platform table: every query here names its Organisation, or is the access guard's own lookup.
@Injectable()
export class SupportGrantRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List the current Organisation's grants, newest first.
   */
  public async listOfCurrent(): Promise<SupportGrantRow[]> {
    return this.unitOfWork.db
      .select()
      .from(supportGrants)
      .where(eq(supportGrants.organisationId, this.unitOfWork.organisationId))
      .orderBy(desc(supportGrants.grantedAt), desc(supportGrants.id));
  }

  /**
   * Record a grant of the current Organisation.
   * @param input who grants it, whether it allows changes, when it starts and ends
   * @throws {Error} when the database returns no row
   */
  public async create(
    input: Pick<SupportGrantRow, 'grantedByAdminId' | 'allowWrites' | 'grantedAt' | 'expiresAt'>,
  ): Promise<SupportGrantRow> {
    const [row] = await this.unitOfWork.db
      .insert(supportGrants)
      .values({ ...input, organisationId: this.unitOfWork.organisationId })
      .returning();

    if (row === undefined) {
      throw new Error('The support grant was not recorded');
    }

    return row;
  }

  /**
   * End the current Organisation's grants in force, or one of them.
   * @param at when
   * @param id the grant, or none for all in force
   * @returns the grants ended
   */
  public async revoke(at: Date, id?: string): Promise<SupportGrantRow[]> {
    return this.unitOfWork.db
      .update(supportGrants)
      .set({ revokedAt: at })
      .where(
        and(
          eq(supportGrants.organisationId, this.unitOfWork.organisationId),
          isNull(supportGrants.revokedAt),
          gt(supportGrants.expiresAt, at),
          ...(id === undefined ? [] : [eq(supportGrants.id, id)]),
        ),
      )
      .returning();
  }

  /**
   * Get a grant of the current Organisation.
   * @param id grant id
   */
  public async getOfCurrent(id: string): Promise<SupportGrantRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(supportGrants)
      .where(and(eq(supportGrants.id, id), eq(supportGrants.organisationId, this.unitOfWork.organisationId)));

    return row ?? null;
  }

  /**
   * Get an Organisation's grant in force now, for the access guard.
   * @param organisationId Organisation id
   * @param now the time now
   */
  public async getActive(organisationId: string, now: Date): Promise<SupportGrantRow | null> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(supportGrants)
      .where(
        and(
          eq(supportGrants.organisationId, organisationId),
          isNull(supportGrants.revokedAt),
          gt(supportGrants.expiresAt, now),
        ),
      )
      .orderBy(desc(supportGrants.grantedAt))
      .limit(1);

    return row ?? null;
  }

  /**
   * List every grant in force now, across Organisations, for the Platform operator's account.
   * @param now the time now
   */
  public async listActive(now: Date): Promise<SupportGrantRow[]> {
    return this.unitOfWork.db
      .select()
      .from(supportGrants)
      .where(and(isNull(supportGrants.revokedAt), gt(supportGrants.expiresAt, now)))
      .orderBy(desc(supportGrants.grantedAt));
  }
}
