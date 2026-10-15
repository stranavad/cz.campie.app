import { defineConfig } from 'oxlint';

import { base } from './src/base.ts';
import { node } from './src/node.ts';
import { typeAware } from './src/type-aware.ts';

export default defineConfig({
  extends: [base, node, typeAware],
});
