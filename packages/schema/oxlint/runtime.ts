import type { OxlintConfig } from 'oxlint';

export const runtime = {
  overrides: [
    {
      files: ['src/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                regex: '^(node:|@nestjs/|@neondatabase/|react|drizzle-|pg$)',
                message: 'Schema runs in Node and the browser: plain Zod and TypeScript, no runtime-specific imports.',
              },
            ],
          },
        ],
      },
    },
  ],
} satisfies OxlintConfig;
