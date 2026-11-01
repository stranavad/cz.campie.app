import { postgres } from './postgres.ts';
import type { ServiceEnv, Started, TestService } from './test-service.ts';

const TEST_SERVICES: TestService[] = [postgres];

// Runs step for every service, merging their env; when one fails, cleans up the ones already done.
async function runAll(step: (service: TestService) => Promise<Started>): Promise<Started> {
  const done: Started[] = [];
  const cleanup = async () => {
    await Promise.all(done.map((started) => started.cleanup()));
  };

  try {
    for (const service of TEST_SERVICES) {
      done.push(await step(service));
    }
  } catch (error) {
    await cleanup();
    throw error;
  }

  return { env: Object.fromEntries(done.flatMap((started) => Object.entries(started.env))), cleanup };
}

/**
 * Start every test service, once per run.
 */
export function startTestServices(): Promise<Started> {
  return runAll((service) => service.start());
}

/**
 * Give one test its own copy of every test service.
 * @param serviceEnv what the services provided when they started
 */
export async function isolateTestServices(serviceEnv: ServiceEnv): Promise<Started> {
  const { env, cleanup } = await runAll((service) => service.isolate(serviceEnv));

  return { env: { ...serviceEnv, ...env }, cleanup };
}
