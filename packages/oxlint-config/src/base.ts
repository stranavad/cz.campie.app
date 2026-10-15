import type { OxlintConfig } from 'oxlint';

export const base = {
  plugins: ['typescript', 'oxc', 'unicorn', 'import'],
  rules: {
    eqeqeq: 'error',
    curly: ['error', 'all'],
    'no-console': 'error',
    'typescript/no-explicit-any': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/no-self-import': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/throw-new-error': 'error',
    'unicorn/custom-error-definition': 'error',
  },
} satisfies OxlintConfig;
