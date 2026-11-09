// The Turnus overviews of an Organisation, one per Turnus, under one key per Organisation.
export const turnusOverviewKeys = {
  all: ['turnus-overview'] as const,
  organisation: (organisationId: string | undefined) => [...turnusOverviewKeys.all, organisationId] as const,
  turnus: (organisationId: string | undefined, turnusId: string | null) =>
    [...turnusOverviewKeys.organisation(organisationId), turnusId] as const,
};
