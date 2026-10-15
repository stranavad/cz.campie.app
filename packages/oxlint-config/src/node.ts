import type { OxlintConfig } from 'oxlint';

export const node = {
  plugins: ['node'],
  overrides: [{ files: ['**'], env: { node: true } }],
} satisfies OxlintConfig;
