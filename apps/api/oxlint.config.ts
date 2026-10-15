import { defineConfig } from 'oxlint';

import { base } from '@repo/oxlint-config/base';
import { node } from '@repo/oxlint-config/node';
import { time } from '@repo/oxlint-config/time';
import { typeAware } from '@repo/oxlint-config/type-aware';
import { vitest } from '@repo/oxlint-config/vitest';

import { boundaries } from './oxlint/boundaries.ts';
import { clock } from './oxlint/clock.ts';
import { env } from './oxlint/env.ts';

export default defineConfig({
  extends: [base, node, typeAware, vitest, time, clock, env, boundaries],
  ignorePatterns: ['dist', 'drizzle'],
});
