import type { OxlintConfig } from 'oxlint';

export const theme = {
  jsPlugins: [new URL('./theme.plugin.ts', import.meta.url).pathname],
  overrides: [
    {
      files: ['src/**/*.tsx', 'src/**/*.ts'],
      rules: { 'theme/no-raw-colours': 'error', 'theme/no-native-pickers': 'error' },
    },
    // The shared file pickers wrap the one native input the browser must open itself.
    {
      files: ['src/components/file-input.tsx', 'src/components/file-button.tsx'],
      rules: { 'theme/no-native-pickers': 'off' },
    },
  ],
} satisfies OxlintConfig;
