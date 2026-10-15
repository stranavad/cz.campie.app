import type { OxlintConfig } from 'oxlint';

export const react = {
  plugins: ['react'],
  rules: {
    'react/rules-of-hooks': 'error',
    'react/only-export-components': ['warn', { allowConstantExport: true }],
  },
} satisfies OxlintConfig;
