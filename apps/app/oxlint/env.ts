import type { OxlintConfig } from 'oxlint';

export const env = {
  rules: {
    'no-restricted-properties': [
      'error',
      { property: 'env', message: 'Use `config` from @/config instead of import.meta.env.' },
    ],
  },
  overrides: [
    { files: ['src/config/env/**'], rules: { 'no-restricted-properties': 'off' } },
    { files: ['vite.config.ts', 'oxlint.config.ts', 'oxlint/**'], rules: { 'no-restricted-properties': 'off' } },
  ],
} satisfies OxlintConfig;
