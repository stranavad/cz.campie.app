import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { afterEach, inject } from 'vitest';

import { guardNetwork, takeBlockedConnections } from './network-guard.ts';

// Hermetic: a variable from the shell would win over the test configuration (a real mail key, a local
// database), so every variable the test configuration sets is cleared before any test boots the app.
// APP_ENV stays: the Vitest config sets it, and it selects the test configuration.
const testConfiguration = parseEnv(readFileSync(new URL('../../.env.test', import.meta.url), 'utf8'));

for (const name of Object.keys(testConfiguration)) {
  if (name !== 'APP_ENV') {
    delete process.env[name];
  }
}

const serviceHosts = Object.values(inject('testServiceEnv')).flatMap((value) =>
  URL.canParse(value) ? [new URL(value).hostname] : [],
);
guardNetwork(serviceHosts);

afterEach(() => {
  const blocked = takeBlockedConnections();

  if (blocked.length > 0) {
    throw new Error(`Outbound connections are blocked in tests; fake them at their port:\n${blocked.join('\n')}`);
  }
});
