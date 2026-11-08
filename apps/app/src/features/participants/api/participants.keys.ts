// An Organisation's Participant lists and Registrations sit under one key per Organisation.
export const participantsKeys = {
  all: ['participants'] as const,
  organisation: (organisationId: string) => [...participantsKeys.all, organisationId] as const,
  detail: (organisationId: string, registrationId: string) =>
    [...participantsKeys.organisation(organisationId), 'registration', registrationId] as const,
  history: (organisationId: string, registrationId: string) =>
    [...participantsKeys.detail(organisationId, registrationId), 'history'] as const,
  list: (organisationId: string, turnusId: string, filters: object) =>
    [...participantsKeys.organisation(organisationId), turnusId, filters] as const,
};
