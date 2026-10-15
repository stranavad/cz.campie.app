import { defineConfig } from 'oxlint';

import { base } from '@repo/oxlint-config/base';
import { typeAware } from '@repo/oxlint-config/type-aware';
import { vitest } from '@repo/oxlint-config/vitest';

import { moduleApi } from './oxlint/module-api.ts';
import { runtime } from './oxlint/runtime.ts';

export default defineConfig({
  extends: [base, typeAware, vitest, moduleApi, runtime],
  ignorePatterns: ['dist'],
});
