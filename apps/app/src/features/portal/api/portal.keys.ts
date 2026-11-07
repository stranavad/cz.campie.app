// The signed-in guardian's Registrations sit under one key.
export const portalKeys = {
  all: ['portal'] as const,
  registrations: () => [...portalKeys.all, 'registrations'] as const,
  edit: (registrationId: string) => [...portalKeys.all, 'edit', registrationId] as const,
  checklist: (registrationId: string) => [...portalKeys.all, 'checklist', registrationId] as const,
  documents: (registrationId: string) => [...portalKeys.all, 'documents', registrationId] as const,
  consents: (registrationId: string) => [...portalKeys.all, 'consents', registrationId] as const,
  consent: (registrationId: string, participantId: string, consentId: string) =>
    [...portalKeys.consents(registrationId), participantId, consentId] as const,
};
