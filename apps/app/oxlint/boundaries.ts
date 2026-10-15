import { existsSync, readdirSync } from 'node:fs';
import type { OxlintConfig, OxlintOverride } from 'oxlint';

const SHARED = ['components', 'lib', 'config'];

const FEATURES_DIR = new URL('../src/features', import.meta.url);

const features = existsSync(FEATURES_DIR)
  ? readdirSync(FEATURES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

interface Pattern {
  group?: string[];
  regex?: string;
  importNames?: string[];
  message: string;
}

const noParentImports: Pattern = { regex: '^\\.\\./', message: 'Use the @/ alias instead of ../ imports.' };

const noApiClient: Pattern = {
  group: ['@/lib/api', '@/lib/api/*'],
  importNames: ['apiClient'],
  message: 'Only *.service.ts files call apiClient; components use the query hooks.',
};

function restrictImports(patterns: Pattern[]) {
  return { 'no-restricted-imports': ['error', { patterns }] } satisfies OxlintOverride['rules'];
}

function restrict(folders: string[], boundary: Pattern[] = []): OxlintOverride[] {
  return [
    {
      files: folders.map((folder) => `${folder}/**`),
      rules: restrictImports([noParentImports, noApiClient, ...boundary]),
    },
    {
      files: folders.map((folder) => `${folder}/**/*.service.ts`),
      rules: restrictImports([noParentImports, ...boundary]),
    },
  ];
}

const sharedBoundary: Pattern = {
  group: ['@/core/**', '@/features/**', '@/routes/**'],
  message: 'Shared code must not import from core, features or routes.',
};

function featureBoundary(own?: string): Pattern {
  return {
    group: ['@/features/**', ...(own === undefined ? [] : [`!@/features/${own}/**`]), '@/routes/**'],
    message: 'Features must not import other features or routes.',
  };
}

export const boundaries = {
  rules: restrictImports([noParentImports, noApiClient]),
  overrides: [
    ...restrict(['src']),
    ...restrict(
      SHARED.map((folder) => `src/${folder}`),
      [sharedBoundary],
    ),
    { files: ['src/lib/api/**'], rules: restrictImports([noParentImports, sharedBoundary]) },
    ...restrict(
      ['src/core'],
      [{ group: ['@/features/**', '@/routes/**'], message: 'Core must not import from features or routes.' }],
    ),
    ...restrict(['src/features'], [featureBoundary()]),
    ...features.flatMap((feature) => restrict([`src/features/${feature}`], [featureBoundary(feature)])),
  ],
} satisfies OxlintConfig;
