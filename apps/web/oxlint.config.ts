import { defineConfig } from 'oxlint';

import { base } from '@repo/oxlint-config/base';
import { node } from '@repo/oxlint-config/node';
import { typeAware } from '@repo/oxlint-config/type-aware';
import { vitest } from '@repo/oxlint-config/vitest';

export default defineConfig({
  extends: [base, typeAware, node, vitest],
  ignorePatterns: ['dist', '.astro', '.wrangler'],
  overrides: [
    // The Worker logs through the console, which Workers Observability collects.
    { files: ['worker/**'], rules: { 'no-console': ['error', { allow: ['error'] }] } },
  ],
});
