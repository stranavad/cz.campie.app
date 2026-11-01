import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';

import type { Env } from '../config/env.schema.ts';
import { JobRunner, type QueuedJob } from './job-runner.ts';
import { JOB_QUEUE } from './job.ts';

// Each running job holds a database connection for its unit of work.
const CONCURRENCY = 4;

// Runs queued jobs in this process when JOB_WORKER is auto. A failed attempt is retried with backoff; the
// last one leaves the job in the queue's failed set, logged here as an error.
@Injectable()
export class JobWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobWorker.name);
  private worker: Worker | undefined;
  private running = 0;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly runner: JobRunner,
  ) {}

  public onApplicationBootstrap(): void {
    if (this.config.get('JOB_WORKER', { infer: true }) !== 'auto') {
      return;
    }

    const connection = { url: this.config.get('REDIS_URL', { infer: true }) };
    this.worker = new Worker(JOB_QUEUE, (job) => this.run(job), { connection, concurrency: CONCURRENCY });
    this.worker.on('error', (error) => this.logger.error(`Job worker: ${error.message}`));
    this.worker.on('failed', (job, error) => {
      // Ids and the error only; the job's data stays in the queue. A job is finished only when it failed
      // for good, so an attempt that will be retried is a warning.
      const message = `Job ${job?.id ?? '?'} (${job?.name ?? '?'}) failed attempt ${job?.attemptsMade ?? '?'}: ${error.message}`;

      if (job?.finishedOn === undefined) {
        this.logger.warn(message);
      } else {
        this.logger.error(`${message}; it stays failed`);
      }
    });
  }

  public async onModuleDestroy(): Promise<void> {
    // A graceful close waits for running jobs, and while Redis is unreachable it never returns. With no job
    // running there is nothing to wait for; a job fetched in that moment returns to the queue once its
    // lock expires.
    await this.worker?.close(this.running === 0);
  }

  /**
   * Run one job, counting it as running meanwhile.
   * @param job the queued job
   */
  private async run(job: QueuedJob): Promise<void> {
    this.running += 1;

    try {
      await this.runner.run(job);
    } finally {
      this.running -= 1;
    }
  }
}
