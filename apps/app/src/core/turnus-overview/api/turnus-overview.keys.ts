// The Turnus overviews of an Organisation, one per Turnus, under one key per Organisation.
export const turnusOverviewKeys = {
  all: ['turnus-overview'] as const,
  organisation: (organisationId: string) => [...turnusOverviewKeys.all, organisationId] as const,
  turnus: (organisationId: string, turnusId: string) =>
    [...turnusOverviewKeys.organisation(organisationId), turnusId] as const,
};
