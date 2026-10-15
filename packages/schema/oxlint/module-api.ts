import type { OxlintConfig } from 'oxlint';

export const moduleApi = {
  jsPlugins: [new URL('./module-api.plugin.js', import.meta.url).pathname],
  rules: {
    'schema/module-api': 'error',
  },
  overrides: [
    {
      files: ['oxlint/**/*.js'],
      rules: {
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-argument': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/strict-boolean-expressions': 'off',
      },
    },
  ],
} satisfies OxlintConfig;
