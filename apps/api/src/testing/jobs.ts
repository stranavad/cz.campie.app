import type { INestApplication } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

import { JobRunner } from '../core/jobs/job-runner.ts';
import { JOB_QUEUE, type JobEnvelope, type RecurringJobDefinition } from '../core/jobs/job.ts';

// Identifies the drain as the holder of the lock on the job it runs.
const TOKEN = 'test-drain';

// One attempt the drain made: completed, retried after delay milliseconds, or failed for good.
export type DrainedAttempt =
  | { readonly job: string; readonly outcome: 'completed' }
  | { readonly job: string; readonly outcome: 'retried'; readonly delay: number; readonly error: string }
  | { readonly job: string; readonly outcome: 'failed'; readonly error: string };

export interface FailedJob {
  readonly job: string;
  readonly attemptsMade: number;
  readonly error: string;
}

async function withQueue<T>(redisUrl: string, work: (queue: Queue, worker: Worker) => Promise<T>): Promise<T> {
  const connection = { url: redisUrl };
  // A worker without a processor that never runs on its own: the drain fetches every job by hand.
  const queue = new Queue(JOB_QUEUE, { connection });
  const worker = new Worker(JOB_QUEUE, null, { connection, autorun: false });

  try {
    return await work(queue, worker);
  } finally {
    await worker.close();
    await queue.close();
  }
}

/**
 * The app's job queue, run by hand in a test.
 * @param app the running test app
 * @param redisUrl the test's own Redis database
 */
export function testJobs(app: INestApplication, redisUrl: string) {
  return {
    /**
     * Run queued jobs one at a time through the app's runner until none is left, including jobs they
     * enqueue; a retry runs at once instead of after its backoff, which the attempt reports. A job enqueued
     * to run later waits, unless asked for.
     * @param options whether to run the jobs enqueued to run later too
     */
    drain: (options: { later?: boolean } = {}) =>
      withQueue(redisUrl, async (queue, worker) => {
        const runner = app.get(JobRunner);
        const attempts: DrainedAttempt[] = [];

        for (;;) {
          for (const delayed of await queue.getDelayed()) {
            if (options.later === true || delayed.attemptsMade > 0) {
              await delayed.promote();
            }
          }

          const job = await worker.getNextJob(TOKEN, { block: false });

          if (job === undefined) {
            return attempts;
          }

          try {
            await runner.run(job);
            await job.moveToCompleted(undefined, TOKEN, false);
            attempts.push({ job: job.name, outcome: 'completed' });
          } catch (thrown) {
            const error = thrown instanceof Error ? thrown : new Error(String(thrown));
            await job.moveToFailed(error, TOKEN, false);

            attempts.push(
              (await job.getState()) === 'failed'
                ? { job: job.name, outcome: 'failed', error: error.message }
                : { job: job.name, outcome: 'retried', delay: job.delay, error: error.message },
            );
          }
        }
      }),

    /**
     * Add a recurring job to the queue as its schedule does when it is due; drain() then runs it.
     * @param job the recurring job
     */
    due: (job: RecurringJobDefinition) =>
      withQueue(redisUrl, async (queue) => {
        const envelope: JobEnvelope = { organisationId: null, payload: {} };

        await queue.add(job.name, envelope);
      }),

    /**
     * Put a job straight into the queue, as one that bypassed the app's enqueue, or that an older version
     * of the app enqueued, would sit there; drain() then runs it.
     * @param name the job's name
     * @param envelope what the job carries, malformed if the test wants it so
     */
    add: (name: string, envelope: unknown) =>
      withQueue(redisUrl, async (queue) => {
        await queue.add(name, envelope);
      }),

    /**
     * The jobs the queue holds as failed for good, as anyone inspecting the queue sees them.
     */
    failed: () =>
      withQueue(redisUrl, async (queue): Promise<FailedJob[]> => {
        const jobs = await queue.getFailed();

        return jobs.map((job) => ({ job: job.name, attemptsMade: job.attemptsMade, error: job.failedReason }));
      }),
  };
}
