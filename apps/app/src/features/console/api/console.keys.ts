// Everything the operator console shows sits under one key.
export const consoleKeys = {
  all: ['console'] as const,
  organisations: () => [...consoleKeys.all, 'organisations'] as const,
  preview: (organisationId: string) => [...consoleKeys.all, 'preview', organisationId] as const,
};
