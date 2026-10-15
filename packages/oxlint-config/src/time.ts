import type { OxlintConfig } from 'oxlint';

export const time = {
  jsPlugins: [new URL('./plugins/time.plugin.ts', import.meta.url).pathname],
} satisfies OxlintConfig;
