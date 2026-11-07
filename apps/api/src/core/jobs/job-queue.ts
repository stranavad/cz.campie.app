import { setTimeout as sleep } from 'node:timers/promises';
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { z } from 'zod';

import type { Env } from '../config/env.schema.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { JOB_QUEUE, type JobDefinition, type JobEnvelope } from './job.ts';

const ATTEMPTS = 8;
// Doubles from the first retry: 30 s, 1 min, 2 min, ... about an hour in all, to outlast a provider outage.
const FIRST_RETRY_DELAY_MS = 30_000;
const KEEP_COMPLETED = 1000;
const KEEP_FAILED_SECONDS = 30 * 24 * 60 * 60;
// How long a unit of work waits for its jobs to reach the queue after it commits.
const SEND_WAIT_MS = 2000;

@Injectable()
export class JobQueue implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueue.name);
  private readonly queue: Queue;

  constructor(
    config: ConfigService<Env, true>,
    private readonly unitOfWork: UnitOfWork,
  ) {
    const connection = { url: config.get('REDIS_URL', { infer: true }) };
    this.queue = new Queue(JOB_QUEUE, {
      connection,
      defaultJobOptions: {
        attempts: ATTEMPTS,
        backoff: { type: 'exponential', delay: FIRST_RETRY_DELAY_MS },
        removeOnComplete: { count: KEEP_COMPLETED },
        removeOnFail: { age: KEEP_FAILED_SECONDS },
      },
    });
    // Without a listener a connection error would crash the process.
    this.queue.on('error', (error) => this.logger.error(`Job queue: ${error.message}`));
  }

  /**
   * Enqueue a job for when the current unit of work commits; an Organisation job takes its Organisation.
   * @param job the job's definition
   * @param payload ids the job works on, never personal data
   * @param options how long after the commit it runs, if not at once
   */
  public enqueue<Payload extends z.ZodType>(
    job: JobDefinition<Payload>,
    payload: z.input<Payload>,
    options: { delayMs?: number } = {},
  ): void {
    // Checked now, so a bad payload fails the change that enqueues it; stored as given, since the runner
    // parses it again.
    job.payload.parse(payload);
    const envelope: JobEnvelope = {
      organisationId: job.scope === 'organisation' ? this.unitOfWork.organisationId : null,
      payload,
    };

    // Sent only after the commit, so a job never runs for a change that rolled back or before the change
    // is visible.
    this.unitOfWork.afterCommit(() => this.send(job.name, envelope, options.delayMs));
  }

  public async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  /**
   * Add a job to the queue, waiting for it a short while at most.
   * @param name the job's name
   * @param envelope its Organisation and payload
   * @param delayMs how long it waits before it runs, if at all
   */
  private async send(name: string, envelope: JobEnvelope, delayMs?: number): Promise<void> {
    // The change is committed by now, so a failure is logged rather than thrown: failing the request
    // would invite repeating a change that happened. While Redis is unreachable an add waits for it
    // without end; the request goes on, and the add with it in the background.
    const added = this.queue.add(name, envelope, delayMs === undefined ? {} : { delay: delayMs }).then(
      () => true,
      (error: unknown) => {
        this.logger.error(`Job ${name} was not enqueued: ${error instanceof Error ? error.message : String(error)}`);

        return true;
      },
    );

    if (!(await Promise.race([added, sleep(SEND_WAIT_MS, false, { ref: false })]))) {
      this.logger.error(`Job ${name} is not enqueued yet; Redis is unreachable`);
    }
  }
}
