// An Organisation's Camps and each Camp's Turnusy with their places taken, under one key per Organisation.
export const campListKeys = {
  all: ['camp-list'] as const,
  organisation: (organisationId: string) => [...campListKeys.all, organisationId] as const,
  camps: (organisationId: string) => [...campListKeys.organisation(organisationId), 'camps'] as const,
  // Every Camp's Turnusy, to invalidate when places change.
  turnusy: (organisationId: string) => [...campListKeys.organisation(organisationId), 'turnusy'] as const,
  campTurnusy: (organisationId: string, campId: string) => [...campListKeys.turnusy(organisationId), campId] as const,
};
