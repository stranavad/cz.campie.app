import {
  useMembersQuery,
  useRequireTotpMutation,
} from '@/features/organisation-settings/api/organisation-settings.queries';

export function useTwoStepSection(organisationId: string) {
  const requireTotp = useRequireTotpMutation(organisationId);
  // The section shows only to Owners, who may list the team.
  const members = useMembersQuery(organisationId, true);

  return {
    // Null until the team is known.
    withoutTotp: members.data === undefined ? null : members.data.filter((member) => !member.totpEnabled).length,
    isSaving: requireTotp.isPending,
    hasFailed: requireTotp.isError,
    setRequired: (required: boolean) => requireTotp.mutate(required),
  };
}
