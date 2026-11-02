// Everything about an Organisation's admins sits under one key, per Organisation.
export const membersKeys = {
  all: ['members'] as const,
  organisation: (organisationId: string) => [...membersKeys.all, organisationId] as const,
  list: (organisationId: string) => [...membersKeys.organisation(organisationId), 'list'] as const,
  invitations: (organisationId: string) => [...membersKeys.organisation(organisationId), 'invitations'] as const,
};
