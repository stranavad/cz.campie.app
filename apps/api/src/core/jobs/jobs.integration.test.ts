import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { organisations } from '../../db/schema.ts';
import { housekeepingJob } from '../../modules/housekeeping/housekeeping.jobs.ts';
import { createOrganisation } from '../../testing/fixtures.ts';
import { createNotesTable, notes } from '../../testing/tenant-table.ts';
import { useTestApp } from '../../testing/test-app.ts';
import type { Env } from '../config/env.schema.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { JobQueue } from './job-queue.ts';
import { defineJob, JOB_QUEUE, JobHandler } from './job.ts';

// Test-only jobs: each handler records what it saw, so a test observes what ran and in which Organisation.

const readNotesJob = defineJob({ name: 'test.read-notes', scope: 'organisation', payload: z.object({}) });

@Injectable()
class ReadNotesHandler extends JobHandler<typeof readNotesJob> {
  public readonly job = readNotesJob;
  public readonly seen: string[][] = [];

  constructor(private readonly unitOfWork: UnitOfWork) {
    super();
  }

  public async handle(): Promise<void> {
    const rows = await this.unitOfWork.db.select({ text: notes.text }).from(notes);
    this.seen.push(rows.map((row) => row.text));
  }
}

const countOrganisationsJob = defineJob({ name: 'test.count-organisations', scope: 'platform', payload: z.object({}) });

@Injectable()
class CountOrganisationsHandler extends JobHandler<typeof countOrganisationsJob> {
  public readonly job = countOrganisationsJob;
  public readonly seen: { organisations: number; notes: number }[] = [];

  constructor(private readonly unitOfWork: UnitOfWork) {
    super();
  }

  public async handle(): Promise<void> {
    const { db } = this.unitOfWork;
    this.seen.push({
      organisations: await db.$count(organisations),
      notes: await db.$count(notes),
    });
  }
}

const unreachableJob = defineJob({ name: 'test.unreachable', scope: 'organisation', payload: z.object({}) });

@Injectable()
class UnreachableHandler extends JobHandler<typeof unreachableJob> {
  public readonly job = unreachableJob;

  public handle(): Promise<void> {
    return Promise.reject(new Error('The provider is unreachable'));
  }
}

const watchedJob = defineJob({
  name: 'test.watched',
  scope: 'organisation',
  payload: z.object({ noteId: z.uuid() }),
  alertWhenFailed: true,
});

@Injectable()
class WatchedHandler extends JobHandler<typeof watchedJob> {
  public readonly job = watchedJob;

  public handle(): Promise<void> {
    return Promise.resolve();
  }
}

const followUpJob = defineJob({ name: 'test.follow-up', scope: 'organisation', payload: z.object({}) });

@Injectable()
class FollowUpHandler extends JobHandler<typeof followUpJob> {
  public readonly job = followUpJob;

  constructor(private readonly queue: JobQueue) {
    super();
  }

  public handle(): Promise<void> {
    this.queue.enqueue(readNotesJob, {});

    return Promise.resolve();
  }
}

describe('background jobs', () => {
  const { app, database, jobs, mail } = useTestApp({
    providers: [ReadNotesHandler, CountOrganisationsHandler, UnreachableHandler, WatchedHandler, FollowUpHandler],
  });
  let organisationA: string;
  let organisationB: string;

  // Run work in an Organisation's unit of work, as a service would.
  const inOrganisation = <T>(organisationId: string, work: (queue: JobQueue) => T) =>
    app()
      .get(UnitOfWork)
      .run(organisationId, async () => work(app().get(JobQueue)));

  beforeEach(async () => {
    await createNotesTable(database().ownerUrl);
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());

    for (const [organisationId, text] of [
      [organisationA, 'note of A'],
      [organisationB, 'note of B'],
    ] as const) {
      await inOrganisation(organisationId, () =>
        app().get(UnitOfWork).db.insert(notes).values({ organisationId, text }),
      );
    }
  });

  it('runs a job in the unit of work of the Organisation that enqueued it, blind to other Organisations', async () => {
    await inOrganisation(organisationA, (queue) => queue.enqueue(readNotesJob, {}));

    expect(app().get(ReadNotesHandler).seen).toEqual([]);

    await jobs().drain();

    expect(app().get(ReadNotesHandler).seen).toEqual([['note of A']]);
  });

  it('refuses to enqueue an Organisation job outside an Organisation unit of work', async () => {
    await expect(
      app()
        .get(UnitOfWork)
        .runForPlatform(async () => app().get(JobQueue).enqueue(readNotesJob, {})),
    ).rejects.toThrow(/no Organisation/);
  });

  it('fails a queued job without an Organisation at once, but runs a platform job without one', async () => {
    await jobs().add(readNotesJob.name, { organisationId: null, payload: {} });
    await app()
      .get(UnitOfWork)
      .runForPlatform(async () => app().get(JobQueue).enqueue(countOrganisationsJob, {}));

    expect(await jobs().drain()).toEqual([
      { job: readNotesJob.name, outcome: 'failed', error: expect.stringMatching(/no Organisation/) },
      { job: countOrganisationsJob.name, outcome: 'completed' },
    ]);
    expect(app().get(ReadNotesHandler).seen).toEqual([]);
    expect(app().get(CountOrganisationsHandler).seen).toEqual([{ organisations: 2, notes: 0 }]);
  });

  // As a job an older version of the app queued, before its payload changed, would sit there.
  it.each([
    ['payload', () => ({ organisationId: organisationA, payload: {} })],
    ['envelope', () => ({ payload: { noteId: organisationA } })],
  ])(
    'alerts the Platform operator to a job asking for it that cannot start for a malformed %s',
    async (_, envelope) => {
      await jobs().add(watchedJob.name, envelope());

      expect(await jobs().drain()).toEqual([
        { job: watchedJob.name, outcome: 'failed', error: expect.stringMatching(/malformed/) },
        { job: 'jobs.failed', outcome: 'completed' },
      ]);
      expect(mail().sent.map(({ to, subject }) => ({ to, subject }))).toEqual([
        { to: ['operator@example.com'], subject: `Úloha selhala: ${watchedJob.name}` },
      ]);
    },
  );

  it('retries a failing job with growing delays, then keeps it as failed', async () => {
    await inOrganisation(organisationA, (queue) => queue.enqueue(unreachableJob, {}));

    const attempts = await jobs().drain();

    expect(attempts.map((attempt) => (attempt.outcome === 'retried' ? attempt.delay : attempt.outcome))).toEqual([
      30_000,
      60_000,
      120_000,
      240_000,
      480_000,
      960_000,
      1_920_000,
      'failed',
    ]);
    expect(await jobs().failed()).toEqual([
      { job: unreachableJob.name, attemptsMade: 8, error: 'The provider is unreachable' },
    ]);
  });

  it('enqueues nothing from a unit of work that rolls back', async () => {
    await expect(
      inOrganisation(organisationA, (queue) => {
        queue.enqueue(readNotesJob, {});
        throw new Error('The change failed after it enqueued a job');
      }),
    ).rejects.toThrow('The change failed');

    expect(await jobs().drain()).toEqual([]);
  });

  it('drains the jobs a job enqueues, in order, in the same Organisation', async () => {
    await inOrganisation(organisationB, (queue) => queue.enqueue(followUpJob, {}));

    expect(await jobs().drain()).toEqual([
      { job: followUpJob.name, outcome: 'completed' },
      { job: readNotesJob.name, outcome: 'completed' },
    ]);
    expect(app().get(ReadNotesHandler).seen).toEqual([['note of B']]);
  });
});

describe('background jobs with the worker running', () => {
  const { app, database } = useTestApp({ env: { JOB_WORKER: 'auto' }, providers: [CountOrganisationsHandler] });

  it('runs queued jobs on its own', async () => {
    await createNotesTable(database().ownerUrl);
    await createOrganisation(app());

    await app()
      .get(UnitOfWork)
      .runForPlatform(async () => app().get(JobQueue).enqueue(countOrganisationsJob, {}));

    await vi.waitFor(
      () => {
        expect(app().get(CountOrganisationsHandler).seen).toEqual([{ organisations: 1, notes: 0 }]);
      },
      { timeout: 5000 },
    );
  });

  it('schedules each recurring job once, however many times the app starts', async () => {
    const config: ConfigService<Env, true> = app().get(ConfigService);
    const queue = new Queue(JOB_QUEUE, { connection: { url: config.get('REDIS_URL', { infer: true }) } });

    try {
      await app().get(JobQueue).schedule(housekeepingJob);

      await vi.waitFor(
        async () => {
          expect(await queue.getJobSchedulers()).toEqual([
            expect.objectContaining({ key: housekeepingJob.name, every: housekeepingJob.everyMs }),
          ]);
        },
        { timeout: 5000 },
      );
    } finally {
      await queue.close();
    }
  });
});

describe('background jobs with Redis unreachable', () => {
  // Nothing listens on port 1.
  const { app, database } = useTestApp({ env: { REDIS_URL: 'redis://127.0.0.1:1' }, providers: [ReadNotesHandler] });

  it('keeps a committed change whose job cannot reach the queue', async () => {
    await createNotesTable(database().ownerUrl);
    const organisationId = await createOrganisation(app());
    const unitOfWork = app().get(UnitOfWork);

    await unitOfWork.run(organisationId, async () => {
      await unitOfWork.db.insert(notes).values({ organisationId, text: 'packing list' });
      app().get(JobQueue).enqueue(readNotesJob, {});
    });

    expect(await unitOfWork.run(organisationId, () => unitOfWork.db.select({ text: notes.text }).from(notes))).toEqual([
      { text: 'packing list' },
    ]);
  });
});
