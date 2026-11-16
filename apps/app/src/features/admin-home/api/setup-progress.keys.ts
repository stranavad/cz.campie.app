// What an Organisation still lacks before its first Registration, under one key per Organisation.
export const setupProgressKeys = {
  all: ['setup-progress'] as const,
  organisation: (organisationId: string) => [...setupProgressKeys.all, organisationId] as const,
};
