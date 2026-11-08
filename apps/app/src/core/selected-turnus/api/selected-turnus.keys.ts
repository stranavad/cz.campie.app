// The admin's Selected Turnus and the Turnusy to switch between, one key per Organisation.
export const selectedTurnusKeys = {
  all: ['selected-turnus'] as const,
  organisation: (organisationId: string) => [...selectedTurnusKeys.all, organisationId] as const,
};
