// The Participant lists of an Organisation's Turnusy, under one key per Organisation.
export const participantListKeys = {
  all: ['participant-list'] as const,
  organisation: (organisationId: string) => [...participantListKeys.all, organisationId] as const,
  turnus: (organisationId: string, turnusId: string | null, filters: object) =>
    [...participantListKeys.organisation(organisationId), turnusId, filters] as const,
};
