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
 * @param options env over the test configuration and test-only controllers
 */
export function useTestApp({ env = {}, controllers }: Omit<BootOptions, 'logger'> = {}) {
  let running: Running | undefined;
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    const isolated = await isolateTestServices(inject('testServiceEnv'));
    cleanup = isolated.cleanup;
    running = { app: await bootApp({ env: { ...isolated.env, ...env }, controllers }), env: isolated.env };
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
    // Sends attempt, which reaches for another Organisation's data, and asserts it is refused and
    // changes nothing; one call per endpoint and identifier.
    expectIsolated: (attempt: Parameters<typeof expectIsolated>[1]) => expectIsolated(database().ownerUrl, attempt),
  };
}
