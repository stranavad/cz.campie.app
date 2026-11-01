import type { TestProject } from 'vitest/node';

import { startPostgres, type PostgresServer } from './services/postgres.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    postgres: PostgresServer;
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const postgres = await startPostgres();
  project.provide('postgres', postgres.server);

  return postgres.stop;
}
