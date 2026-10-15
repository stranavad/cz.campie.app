import type { OxlintConfig, OxlintOverride } from 'oxlint';

const DRIZZLE = ['drizzle-orm', 'drizzle-orm/*', 'drizzle-kit', 'pg', '@neondatabase/*'];

function folders(...names: string[]) {
  return `(^|/)(${names.join('|')})/`;
}

interface Pattern {
  group?: string[];
  regex?: string;
  message: string;
}

function restrict(files: string[], patterns: Pattern[]): OxlintOverride {
  return { files, rules: { 'no-restricted-imports': ['error', { patterns }] } };
}

export const boundaries = {
  overrides: [
    restrict(
      ['src/**/*.controller.ts'],
      [
        {
          regex: folders('repositories', 'db', 'database', 'ports'),
          message: 'Controllers inject only services: no repositories, database or ports.',
        },
        { group: DRIZZLE, message: 'Controllers must not query the database; call a service.' },
      ],
    ),
    restrict(
      ['src/repositories/**'],
      [
        {
          regex: folders('modules', 'ports', 'config'),
          message: 'Repositories inject only the unit of work: no services, ports or config.',
        },
        { group: ['@nestjs/config'], message: 'Repositories inject only the unit of work, not config.' },
      ],
    ),
    restrict(
      ['src/db/**'],
      [
        {
          regex: folders('modules', 'repositories'),
          message: 'The Drizzle schema imports no modules or repositories.',
        },
      ],
    ),
  ],
} satisfies OxlintConfig;
