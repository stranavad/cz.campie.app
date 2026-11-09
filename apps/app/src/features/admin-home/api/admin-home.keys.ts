// What the overview reads, under one key per Organisation.
export const adminHomeKeys = {
  all: ['admin-home'] as const,
  organisation: (organisationId: string) => [...adminHomeKeys.all, organisationId] as const,
  participants: (organisationId: string, turnusId: string) =>
    [...adminHomeKeys.organisation(organisationId), 'participants', turnusId] as const,
  camps: (organisationId: string) => [...adminHomeKeys.organisation(organisationId), 'camps'] as const,
  turnusy: (organisationId: string, campId: string) =>
    [...adminHomeKeys.organisation(organisationId), 'turnusy', campId] as const,
};
