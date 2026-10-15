import type { OxlintConfig } from 'oxlint';

export const typeAware = {
  rules: {
    'typescript/no-floating-promises': 'error',
    'typescript/no-misused-promises': 'error',
    'typescript/switch-exhaustiveness-check': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-return': 'error',
    'typescript/return-await': ['error', 'in-try-catch'],
    'typescript/prefer-promise-reject-errors': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/strict-boolean-expressions': 'error',
  },
} satisfies OxlintConfig;
