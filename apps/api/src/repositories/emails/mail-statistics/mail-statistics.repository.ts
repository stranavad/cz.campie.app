import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { mailStatistics } from '../../../db/schema.ts';

export type MailCount = 'sent' | 'skipped' | 'bounced' | 'complained';

export interface MailCounts {
  readonly sent: number;
  readonly skipped: number;
  readonly bounced: number;
  readonly complained: number;
}

@Injectable()
export class MailStatisticsRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Count messages of an Organisation.
   * @param organisationId the Organisation
   * @param count which count
   * @param by how many
   */
  public async add(organisationId: string, count: MailCount, by: number): Promise<void> {
    await this.unitOfWork.db
      .insert(mailStatistics)
      .values({ organisationId, [count]: by })
      .onConflictDoUpdate({
        target: mailStatistics.organisationId,
        set: { [count]: sql`${mailStatistics[count]} + ${by}` },
      });
  }

  /**
   * Get an Organisation's counts, none before its first message.
   * @param organisationId the Organisation
   */
  public async getOf(organisationId: string): Promise<MailCounts> {
    const [row] = await this.unitOfWork.db
      .select()
      .from(mailStatistics)
      .where(eq(mailStatistics.organisationId, organisationId));

    return row ?? { sent: 0, skipped: 0, bounced: 0, complained: 0 };
  }

  /**
   * List every Organisation's counts, for the console.
   */
  public async listAll(): Promise<Map<string, MailCounts>> {
    const rows = await this.unitOfWork.db.select().from(mailStatistics);

    return new Map(rows.map(({ organisationId, ...counts }) => [organisationId, counts]));
  }
}
