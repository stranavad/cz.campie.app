import type { TestProject } from 'vitest/node';

import { startTestServices } from './services/test-services.ts';

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const { env, cleanup } = await startTestServices();
  project.provide('testServiceEnv', env);

  return cleanup;
}
