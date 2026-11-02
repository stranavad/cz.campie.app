// The invitation a link opens, by its token.
export const invitationKeys = {
  all: ['invitation'] as const,
  preview: (token: string) => [...invitationKeys.all, token] as const,
};
