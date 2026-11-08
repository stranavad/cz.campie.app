import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { UnrecoverableError } from 'bullmq';

import { UnitOfWork } from '../database/unit-of-work.ts';
import { jobFailedJob } from './job-failed.job.ts';
import { JobQueue } from './job-queue.ts';
import { isRecurring, jobEnvelope, JobHandler, type RecurringJobDefinition } from './job.ts';

// A queued job as the runner needs it: its name, the envelope stored with it, and how many of its
// attempts failed before this one, of how many it has.
export interface QueuedJob {
  readonly id?: string | undefined;
  readonly name: string;
  readonly data: unknown;
  readonly attemptsMade: number;
  readonly opts: { readonly attempts?: number | undefined };
}

// A plain instanceof would narrow to a handler of any job, typed any.
function isJobHandler(value: unknown): value is JobHandler {
  return value instanceof JobHandler;
}

@Injectable()
export class JobRunner implements OnModuleInit {
  private readonly logger = new Logger(JobRunner.name);
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly unitOfWork: UnitOfWork,
    private readonly queue: JobQueue,
  ) {}

  /**
   * Collect every provider that handles a job.
   * @throws {Error} when two providers handle the same job
   */
  public onModuleInit(): void {
    for (const { instance } of this.discovery.getProviders()) {
      if (!isJobHandler(instance)) {
        continue;
      }

      if (this.handlers.has(instance.job.name)) {
        throw new Error(`Job ${instance.job.name} has more than one handler`);
      }

      this.handlers.set(instance.job.name, instance);
    }
  }

  /**
   * Run a queued job in its Organisation's unit of work, or in a platform one for a platform job.
   * @param job the queued job
   * @throws {Error} for a job no handler knows, to retry it: another version of the app may know it
   * @throws {UnrecoverableError} for a malformed envelope or payload, an Organisation job without an
   * Organisation or a platform job with one, none of which a retry mends
   */
  public async run(job: QueuedJob): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (handler === undefined) {
      throw new Error(`No handler for job ${job.name}`);
    }

    const envelope = jobEnvelope.safeParse(job.data);

    if (!envelope.success) {
      throw new UnrecoverableError(`Job ${job.name} has a malformed envelope`);
    }

    const payload = handler.job.payload.safeParse(envelope.data.payload);

    if (!payload.success) {
      throw new UnrecoverableError(`Job ${job.name} has a malformed payload`);
    }

    const { organisationId } = envelope.data;
    const work = () => handler.handle(payload.data);

    if (handler.job.scope === 'platform') {
      if (organisationId !== null) {
        throw new UnrecoverableError(`Platform job ${job.name} carries an Organisation`);
      }

      return this.alertingWhenFailed(handler, job, null, () => this.unitOfWork.runForPlatform(work));
    }

    if (organisationId === null) {
      throw new UnrecoverableError(`Job ${job.name} has no Organisation and is not a platform job`);
    }

    return this.alertingWhenFailed(handler, job, organisationId, () => this.unitOfWork.run(organisationId, work));
  }

  /**
   * List the recurring jobs some handler runs.
   */
  public recurringJobs(): RecurringJobDefinition[] {
    return [...this.handlers.values()].map(({ job }) => job).filter(isRecurring);
  }

  /**
   * Run a job's unit of work and, when its last attempt fails and its job asks for it, have the Platform
   * operator alerted. The failure is thrown on either way.
   * @param handler the job's handler
   * @param job the queued job
   * @param organisationId the job's Organisation, or null for a platform job
   * @param run runs the job's unit of work
   */
  private async alertingWhenFailed(
    handler: JobHandler,
    job: QueuedJob,
    organisationId: string | null,
    run: () => Promise<void>,
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      const last = error instanceof UnrecoverableError || job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      if (last && handler.job.alertWhenFailed === true) {
        await this.alert(job, organisationId);
      }

      throw error;
    }
  }

  /**
   * Enqueue the Platform operator's alert of a job that failed for good. Best effort: a failure to enqueue
   * it is logged, so the job's own error still ends the attempt.
   * @param job the queued job
   * @param organisationId the job's Organisation, or null for a platform job
   */
  private async alert(job: QueuedJob, organisationId: string | null): Promise<void> {
    try {
      await this.unitOfWork.runForPlatform(async () =>
        this.queue.enqueue(jobFailedJob, { job: job.name, jobId: job.id ?? null, organisationId }),
      );
    } catch (error) {
      this.logger.error(
        `The alert of failed job ${job.id ?? '?'} (${job.name}) was not enqueued: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
