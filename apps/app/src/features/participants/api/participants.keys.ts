// An Organisation's Registrations and the Turnus tools sit under one key per Organisation; the lists are in
// core/participant-list.
export const participantsKeys = {
  all: ['participants'] as const,
  organisation: (organisationId: string) => [...participantsKeys.all, organisationId] as const,
  detail: (organisationId: string, registrationId: string) =>
    [...participantsKeys.organisation(organisationId), 'registration', registrationId] as const,
  history: (organisationId: string, registrationId: string) =>
    [...participantsKeys.detail(organisationId, registrationId), 'history'] as const,
};
