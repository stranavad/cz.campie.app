import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { JobQueue } from './job-queue.ts';
import { JobRunner } from './job-runner.ts';
import { JobWorker } from './job-worker.ts';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [JobQueue, JobRunner, JobWorker],
  exports: [JobQueue],
})
export class JobsModule {}
