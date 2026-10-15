import { defineConfig } from 'vitest/config';

const INTEGRATION_TESTS = 'src/**/*.integration.test.ts';

export default defineConfig({
  // Without these Oxc can't parse Nest's decorators or emit the metadata dependency injection reads.
  oxc: {
    decorator: { legacy: true, emitDecoratorMetadata: true },
  },
  test: {
    environment: 'node',
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'], exclude: [INTEGRATION_TESTS] } },
      { extends: true, test: { name: 'integration', include: [INTEGRATION_TESTS] } },
    ],
  },
});
