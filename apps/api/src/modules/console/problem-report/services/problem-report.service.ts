import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ProblemReport, ReportProblemBody, SendFeedbackBody } from '@repo/schema/console';

import type { Actor } from '../../../../core/audit/actor.ts';
import type { Env } from '../../../../core/config/env.schema.ts';
import { UnitOfWork } from '../../../../core/database/unit-of-work.ts';
import { EmailService } from '../../../../core/emails/email.service.ts';
import { JobQueue } from '../../../../core/jobs/job-queue.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { RateLimiter, type RequestLimit } from '../../../../core/rate-limits/rate-limiter.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';
import {
  ProblemReportRepository,
  type ProblemReportRow,
} from '../../../../repositories/console/problem-report/problem-report.repository.ts';
import { problemReportedJob } from '../problem-report.job.ts';
import { ProblemReportedEmail } from '../problem-reported.email.tsx';

// Feedback from admins and technical problems from guardians, reaching the Platform operator with the
// Organisation and page attached and nothing of a family but what was typed. Limited per address and per
// admin or Organisation.
@Injectable()
export class ProblemReportService {
  private readonly limit: RequestLimit;
  private readonly operatorEmail: string;

  constructor(
    private readonly reports: ProblemReportRepository,
    private readonly admins: AdminRepository,
    private readonly emails: EmailService,
    private readonly jobs: JobQueue,
    private readonly rateLimiter: RateLimiter,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('requestLimits', { infer: true }).problemReport;
    this.operatorEmail = config.get('PLATFORM_OPERATOR_EMAIL', { infer: true });
  }

  /**
   * Record an admin's feedback with their Organisation and account, and tell the operator.
   * @param actor the admin
   * @param body the page and text
   */
  public async sendFeedback(actor: Actor, body: SendFeedbackBody): Promise<void> {
    if (actor.kind === 'system' || actor.kind === 'guardian') {
      throw new Error('An admin sends feedback');
    }

    await this.rateLimiter.admit(this.limit, { ipAddress: actor.ipAddress, target: actor.identity });
    await this.record({
      kind: 'admin',
      organisationId: this.unitOfWork.organisationId,
      adminId: actor.identity,
      email: null,
      ...body,
    });
  }

  /**
   * Record a technical problem from an Organisation's pages, and tell the operator. Only the address's
   * limit refuses a report: the Organisation's only stops the emails, so someone flooding one Organisation
   * from many addresses fills the operator's inbox no further and silences no real guardian.
   * @param body the page, text and the address to answer, if any
   * @param ipAddress where the request came from
   */
  public async reportProblem(body: ReportProblemBody, ipAddress: string): Promise<void> {
    await this.rateLimiter.admitAddress(this.limit, ipAddress);
    const emailed = (await this.rateLimiter.take(this.limit.target, this.unitOfWork.organisationId)) !== null;

    await this.record(
      {
        kind: 'guardian',
        organisationId: this.unitOfWork.organisationId,
        adminId: null,
        ...body,
      },
      emailed,
    );
  }

  /**
   * List the reports, open first, then newest first.
   */
  public async list(): Promise<ProblemReport[]> {
    const rows = await this.reports.list();
    const senders = await this.sendersOf(rows.map(({ report }) => report));

    return rows.map(({ report, organisationName }) => this.show(report, organisationName, senders));
  }

  /**
   * Mark a report dealt with.
   * @param reportId report id
   * @throws {NotFoundException} when there is no such report
   */
  public async resolve(reportId: string): Promise<ProblemReport> {
    await this.reports.resolve(reportId, this.clock.now());
    const found = await this.reports.get(reportId);

    if (found === null) {
      throw new NotFoundException();
    }

    return this.show(found.report, found.organisationName, await this.sendersOf([found.report]));
  }

  /**
   * Email the operator a report, from its platform job.
   * @param reportId report id
   */
  public async notify(reportId: string): Promise<void> {
    const found = await this.reports.get(reportId);

    if (found === null) {
      return;
    }

    const shown = this.show(found.report, found.organisationName, await this.sendersOf([found.report]));

    await this.emails.sendForPlatform(
      ProblemReportedEmail,
      {
        kind: shown.kind,
        organisation: shown.organisation?.displayName ?? '-',
        from: shown.from ?? '-',
        pageUrl: shown.pageUrl,
        text: shown.text,
      },
      { to: [this.operatorEmail] },
    );
  }

  /**
   * Record a report and enqueue the operator's email.
   * @param input the report
   * @param emailed whether to email the operator; the console lists it either way
   */
  private async record(input: Omit<ProblemReportRow, 'id' | 'sentAt' | 'resolvedAt'>, emailed = true): Promise<void> {
    const report = await this.reports.create({ ...input, sentAt: this.clock.now() });

    if (emailed) {
      this.jobs.enqueue(problemReportedJob, { reportId: report.id });
    }
  }

  /**
   * Find the email of each admin who sent one of reports.
   * @param reports the reports
   */
  private async sendersOf(reports: readonly ProblemReportRow[]): Promise<Map<string, string>> {
    return this.admins.listEmailsByIds([
      ...new Set(reports.flatMap(({ adminId }) => (adminId === null ? [] : [adminId]))),
    ]);
  }

  /**
   * Show a report as the console does.
   * @param report the report
   * @param organisationName its Organisation's name
   * @param senders admins' emails by id
   */
  private show(
    report: ProblemReportRow,
    organisationName: string | null,
    senders: ReadonlyMap<string, string>,
  ): ProblemReport {
    return {
      id: report.id,
      kind: report.kind,
      organisation:
        report.organisationId === null || organisationName === null
          ? null
          : { id: report.organisationId, displayName: organisationName },
      from: report.adminId === null ? report.email : (senders.get(report.adminId) ?? null),
      pageUrl: report.pageUrl,
      text: report.text,
      sentAt: report.sentAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
    };
  }
}
