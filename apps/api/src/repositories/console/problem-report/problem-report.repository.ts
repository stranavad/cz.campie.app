import { Injectable } from '@nestjs/common';
import { asc, desc, eq, sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { organisations, problemReports } from '../../../db/schema.ts';

export type ProblemReportRow = InferSelectModel<typeof problemReports>;

// A platform table: written from an Organisation's requests, read only by the Platform operator's console.
@Injectable()
export class ProblemReportRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Record a report.
   * @param input the kind, Organisation, sender, page, text and when
   * @throws {Error} when the database returns no row
   */
  public async create(input: Omit<InferInsertModel<typeof problemReports>, 'id'>): Promise<ProblemReportRow> {
    const [row] = await this.unitOfWork.db.insert(problemReports).values(input).returning();

    if (row === undefined) {
      throw new Error('The report was not recorded');
    }

    return row;
  }

  /**
   * List the reports with their Organisation's name, open ones first, then newest first.
   */
  public async list(): Promise<{ report: ProblemReportRow; organisationName: string | null }[]> {
    return this.unitOfWork.db
      .select({ report: problemReports, organisationName: organisations.displayName })
      .from(problemReports)
      .leftJoin(organisations, eq(organisations.id, problemReports.organisationId))
      .orderBy(asc(sql`${problemReports.resolvedAt} IS NOT NULL`), desc(problemReports.sentAt))
      .limit(500);
  }

  /**
   * Get a report with its Organisation's name.
   * @param id report id
   */
  public async get(id: string): Promise<{ report: ProblemReportRow; organisationName: string | null } | null> {
    const [row] = await this.unitOfWork.db
      .select({ report: problemReports, organisationName: organisations.displayName })
      .from(problemReports)
      .leftJoin(organisations, eq(organisations.id, problemReports.organisationId))
      .where(eq(problemReports.id, id));

    return row ?? null;
  }

  /**
   * Mark a report dealt with, if it is not yet.
   * @param id report id
   * @param at when
   */
  public async resolve(id: string, at: Date): Promise<void> {
    await this.unitOfWork.db
      .update(problemReports)
      .set({ resolvedAt: sql`coalesce(${problemReports.resolvedAt}, ${at})` })
      .where(eq(problemReports.id, id));
  }
}
