import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { UnrecoverableError } from 'bullmq';

import { UnitOfWork } from '../database/unit-of-work.ts';
import { jobEnvelope, JobHandler } from './job.ts';

// A queued job as the runner needs it: its name and the envelope stored with it.
export interface QueuedJob {
  readonly name: string;
  readonly data: unknown;
}

// A plain instanceof would narrow to a handler of any job, typed any.
function isJobHandler(value: unknown): value is JobHandler {
  return value instanceof JobHandler;
}

@Injectable()
export class JobRunner implements OnModuleInit {
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly unitOfWork: UnitOfWork,
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

      return this.unitOfWork.runForPlatform(work);
    }

    if (organisationId === null) {
      throw new UnrecoverableError(`Job ${job.name} has no Organisation and is not a platform job`);
    }

    return this.unitOfWork.run(organisationId, work);
  }
}
