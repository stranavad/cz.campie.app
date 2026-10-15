import { defineConfig } from 'oxlint';

import { a11y } from '@repo/oxlint-config/a11y';
import { base } from '@repo/oxlint-config/base';
import { react } from '@repo/oxlint-config/react';
import { typeAware } from '@repo/oxlint-config/type-aware';

import { boundaries } from './oxlint/boundaries.ts';
import { env } from './oxlint/env.ts';
import { translations } from './oxlint/translations.ts';

export default defineConfig({
  extends: [base, typeAware, react, a11y, env, translations, boundaries],
  ignorePatterns: ['dist'],
});
