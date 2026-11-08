import { defineConfig } from 'oxlint';

import { a11y } from '@repo/oxlint-config/a11y';
import { base } from '@repo/oxlint-config/base';
import { react } from '@repo/oxlint-config/react';
import { typeAware } from '@repo/oxlint-config/type-aware';

import { boundaries } from './oxlint/boundaries.ts';
import { env } from './oxlint/env.ts';
import { shadcn } from './oxlint/shadcn.ts';
import { theme } from './oxlint/theme.ts';
import { translations } from './oxlint/translations.ts';

export default defineConfig({
  extends: [base, typeAware, react, a11y, env, translations, boundaries, shadcn, theme],
  ignorePatterns: ['dist', 'src/routeTree.gen.ts'],
});
