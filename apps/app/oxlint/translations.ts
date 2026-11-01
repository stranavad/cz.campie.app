import type { OxlintConfig } from 'oxlint';

export const translations = {
  jsPlugins: [new URL('./translations.plugin.ts', import.meta.url).pathname],
  rules: {
    // Text children, plain, wrapped in braces or in a template literal.
    'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
    'translations/no-literal-text-props': [
      'error',
      {
        props: [
          'alt',
          'aria-description',
          'aria-label',
          'aria-placeholder',
          'aria-roledescription',
          'aria-valuetext',
          'label',
          'placeholder',
          'title',
        ],
      },
    ],
  },
} satisfies OxlintConfig;
