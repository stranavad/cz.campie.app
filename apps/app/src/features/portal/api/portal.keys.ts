// The signed-in guardian's Registrations sit under one key.
export const portalKeys = {
  all: ['portal'] as const,
  registrations: () => [...portalKeys.all, 'registrations'] as const,
};
