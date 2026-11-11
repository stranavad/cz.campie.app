import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNotNull, isNull, lte, or, sql, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { supportEntries, supportGrants } from '../../../db/schema.ts';

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

  /**
   * Tell whether an admin session has an open visit under a grant.
   * @param grantId the grant
   * @param sessionId the session
   */
  public async hasOpenVisit(grantId: string, sessionId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db
      .select({ id: supportEntries.id })
      .from(supportEntries)
      .where(
        and(
          eq(supportEntries.grantId, grantId),
          eq(supportEntries.sessionId, sessionId),
          isNull(supportEntries.leftAt),
        ),
      );

    return row !== undefined;
  }

  /**
   * Get the grant of an admin session's visit not left, if any.
   * @param sessionId the session
   */
  public async getOpenVisitGrantId(sessionId: string): Promise<string | null> {
    const [row] = await this.unitOfWork.db
      .select({ grantId: supportEntries.grantId })
      .from(supportEntries)
      .where(and(eq(supportEntries.sessionId, sessionId), isNull(supportEntries.leftAt)));

    return row?.grantId ?? null;
  }

  /**
   * Close an admin session's visit under a grant no longer in force, as of the grant's end, so it never
   * holds the session's one open visit.
   * @param sessionId the session
   * @param now the time now
   */
  public async closeEndedVisits(sessionId: string, now: Date): Promise<void> {
    await this.unitOfWork.db
      .update(supportEntries)
      .set({ leftAt: sql`least(${supportGrants.revokedAt}, ${supportGrants.expiresAt})` })
      .from(supportGrants)
      .where(
        and(
          eq(supportGrants.id, supportEntries.grantId),
          eq(supportEntries.sessionId, sessionId),
          isNull(supportEntries.leftAt),
          or(isNotNull(supportGrants.revokedAt), lte(supportGrants.expiresAt, now)),
        ),
      );
  }

  /**
   * Open a visit of an admin session under a grant, unless the session has one open already.
   * @param grantId the grant
   * @param sessionId the session
   * @param enteredAt when
   * @returns whether the visit was opened
   */
  public async openVisit(grantId: string, sessionId: string, enteredAt: Date): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .insert(supportEntries)
      .values({ grantId, sessionId, enteredAt })
      .onConflictDoNothing()
      .returning({ id: supportEntries.id });

    return rows.length > 0;
  }

  /**
   * Close an admin session's open visit under a grant.
   * @param grantId the grant
   * @param sessionId the session
   * @param leftAt when
   * @returns whether there was one to close
   */
  public async leaveVisit(grantId: string, sessionId: string, leftAt: Date): Promise<boolean> {
    const rows = await this.unitOfWork.db
      .update(supportEntries)
      .set({ leftAt })
      .where(
        and(
          eq(supportEntries.grantId, grantId),
          eq(supportEntries.sessionId, sessionId),
          isNull(supportEntries.leftAt),
        ),
      )
      .returning({ id: supportEntries.id });

    return rows.length > 0;
  }
}
