import type { OxlintConfig } from 'oxlint';

export const env = {
  rules: {
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: 'Inject ConfigService<Env, true> instead of reading process.env.',
      },
    ],
  },
  overrides: [
    {
      files: ['src/core/config/**', 'src/testing/**', 'drizzle.config.ts', 'vitest.config.ts'],
      rules: { 'no-restricted-properties': 'off' },
    },
  ],
} satisfies OxlintConfig;
