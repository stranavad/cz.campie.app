import { Injectable } from '@nestjs/common';
import { eq, gte, sql, type SQL } from 'drizzle-orm';

import type { MailCounts } from '@repo/schema/console';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { mailStatistics } from '../../../db/schema.ts';

export type MailCount = 'sent' | 'skipped' | 'bounced' | 'complained';

// An Organisation's mail since its first message, and since a given day.
export interface MailSummary {
  readonly total: MailCounts;
  readonly recent: MailCounts;
}

const NO_COUNTS: MailCounts = { sent: 0, bounced: 0, complained: 0 };

export const NO_MAIL: MailSummary = { total: NO_COUNTS, recent: NO_COUNTS };

@Injectable()
export class MailStatisticsRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Count messages of an Organisation on a day.
   * @param organisationId the Organisation
   * @param day the Prague day, YYYY-MM-DD
   * @param count which count
   * @param by how many
   */
  public async add(organisationId: string, day: string, count: MailCount, by: number): Promise<void> {
    await this.unitOfWork.db
      .insert(mailStatistics)
      .values({ organisationId, day, [count]: by })
      .onConflictDoUpdate({
        target: [mailStatistics.organisationId, mailStatistics.day],
        set: { [count]: sql`${mailStatistics[count]} + ${by}` },
      });
  }

  /**
   * Sum an Organisation's counts, none before its first message.
   * @param organisationId the Organisation
   * @param since the first Prague day of the recent counts, YYYY-MM-DD
   */
  public async getOf(organisationId: string, since: string): Promise<MailSummary> {
    const summaries = await this.summarise(since, eq(mailStatistics.organisationId, organisationId));

    return summaries.get(organisationId) ?? NO_MAIL;
  }

  /**
   * Sum every Organisation's counts, for the console; one without mail is left out.
   * @param since the first Prague day of the recent counts, YYYY-MM-DD
   */
  public listAll(since: string): Promise<Map<string, MailSummary>> {
    return this.summarise(since);
  }

  /**
   * Sum the counts per Organisation, in total and since a day.
   * @param since the first Prague day of the recent counts
   * @param where which Organisations, all when omitted
   */
  private async summarise(since: string, where?: SQL): Promise<Map<string, MailSummary>> {
    const recent = gte(mailStatistics.day, since);
    const total = (count: MailCount) => sql`sum(${mailStatistics[count]})`.mapWith(Number);
    const recentSum = (count: MailCount) =>
      sql`coalesce(sum(${mailStatistics[count]}) filter (where ${recent}), 0)`.mapWith(Number);

    const rows = await this.unitOfWork.db
      .select({
        organisationId: mailStatistics.organisationId,
        sent: total('sent'),
        bounced: total('bounced'),
        complained: total('complained'),
        recentSent: recentSum('sent'),
        recentBounced: recentSum('bounced'),
        recentComplained: recentSum('complained'),
      })
      .from(mailStatistics)
      .where(where)
      .groupBy(mailStatistics.organisationId);

    return new Map(
      rows.map((row) => [
        row.organisationId,
        {
          total: { sent: row.sent, bounced: row.bounced, complained: row.complained },
          recent: { sent: row.recentSent, bounced: row.recentBounced, complained: row.recentComplained },
        },
      ]),
    );
  }
}
