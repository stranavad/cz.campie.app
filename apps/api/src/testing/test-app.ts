import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, inject } from 'vitest';

import { Clock } from '../core/ports/clock/clock.port.ts';
import { ControllableClock } from '../core/ports/clock/controllable-clock.adapter.ts';
import { FileStorage } from '../core/ports/file-storage/file-storage.port.ts';
import { MemoryFileStorage } from '../core/ports/file-storage/memory-file-storage.adapter.ts';
import { FakeMailSender } from '../core/ports/mail-sender/fake-mail-sender.adapter.ts';
import { MailSender } from '../core/ports/mail-sender/mail-sender.port.ts';
import { FakePaymentGateway } from '../core/ports/payment-gateway/fake-payment-gateway.adapter.ts';
import { PaymentGateway } from '../core/ports/payment-gateway/payment-gateway.port.ts';
import { FakePdfRenderer } from '../core/ports/pdf-renderer/fake-pdf-renderer.adapter.ts';
import { PdfRenderer } from '../core/ports/pdf-renderer/pdf-renderer.port.ts';
import { bootApp, restoreEnv, type BootOptions } from './boot-app.ts';
import { testJobs } from './jobs.ts';
import { expectPermission, type PermissionAttempt, type Requirement } from './permissions.ts';
import { testDatabase } from './services/postgres.ts';
import type { ServiceEnv } from './services/test-service.ts';
import { isolateTestServices } from './services/test-services.ts';
import { expectIsolated } from './tenant-isolation.ts';

interface Running {
  app: INestApplication<Server>;
  env: ServiceEnv;
}

/**
 * Boot the real app for every test in the calling suite, on the test's own copy of every test service,
 * and tear it down after. Read the accessors inside a test or a hook.
 * @param options env over the test configuration, test-only controllers and providers
 */
export function useTestApp({ env = {}, controllers, providers }: Omit<BootOptions, 'logger'> = {}) {
  let running: Running | undefined;
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    const isolated = await isolateTestServices(inject('testServiceEnv'));
    cleanup = isolated.cleanup;
    running = { app: await bootApp({ env: { ...isolated.env, ...env }, controllers, providers }), env: isolated.env };
  });

  afterEach(async () => {
    await running?.app.close();
    running = undefined;
    restoreEnv();
    await cleanup?.();
    cleanup = undefined;
  });

  const current = (): Running => {
    if (running === undefined) {
      throw new Error('The test app exists only inside a test');
    }

    return running;
  };

  // The adapter the app holds for a port, as its fake, so a test reads what the app sent through it.
  const fake =
    <P, T extends P>(port: abstract new (...args: never[]) => P, adapter: new () => T) =>
    (): T => {
      const held = current().app.get(port);

      if (!(held instanceof adapter)) {
        throw new Error(`${port.name} is not configured with ${adapter.name} in this test`);
      }

      return held;
    };

  const database = () => testDatabase(current().env);

  const jobs = () => {
    const { app, env } = current();
    const redisUrl = env.REDIS_URL;

    if (redisUrl === undefined) {
      throw new Error('The redis test service has not isolated a database for this test');
    }

    return testJobs(app, redisUrl);
  };

  return {
    app: () => current().app,
    http: () => request(current().app.getHttpServer()),
    clock: fake(Clock, ControllableClock),
    mail: fake(MailSender, FakeMailSender),
    files: fake(FileStorage, MemoryFileStorage),
    payments: fake(PaymentGateway, FakePaymentGateway),
    pdfs: fake(PdfRenderer, FakePdfRenderer),
    // The test's database: as its owner, for arranging and inspecting data around what the app does,
    // and as the application role the app connects with.
    database,
    // The job queue, which runs nothing on its own in tests: drain() runs what is queued, in order.
    jobs,
    // Sends attempt, which reaches for another Organisation's data, and asserts it is refused and
    // changes nothing; one call per endpoint and identifier.
    expectIsolated: (attempt: Parameters<typeof expectIsolated>[1]) => expectIsolated(database().ownerUrl, attempt),
    // Sends attempt as members at every level the requirement tells apart, in the given Organisation, and
    // asserts who is refused with permission_denied, changing nothing, and who is admitted; one call per
    // route, with its @Requires in the same words, such as (['registrations', 'read'], ...).
    expectPermission: (requirement: Requirement, organisationId: string, attempt: PermissionAttempt) =>
      expectPermission(current().app, database().ownerUrl, requirement, organisationId, attempt),
  };
}
