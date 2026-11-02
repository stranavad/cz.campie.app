import type { OxlintConfig } from 'oxlint';

// shadcn's generated primitives keep their upstream shape, so later `add` runs diff cleanly.
export const shadcn = {
  overrides: [
    {
      files: ['src/components/ui/**'],
      rules: {
        eqeqeq: 'off',
        'react/only-export-components': 'off',
        'typescript/strict-boolean-expressions': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/prefer-tag-over-role': 'off',
      },
    },
  ],
} satisfies OxlintConfig;
