import type { OxlintConfig } from 'oxlint';

export const clock = {
  rules: {
    'time/no-current-time': ['error', { message: 'Read the current time from the Clock port.' }],
  },
  overrides: [
    {
      files: ['src/core/ports/clock/**', 'src/testing/**', 'src/**/*.test.ts'],
      rules: { 'time/no-current-time': 'off' },
    },
  ],
} satisfies OxlintConfig;
