import { useState } from 'react';

import {
  useMembersQuery,
  useRequireTotpMutation,
} from '@/features/organisation-settings/api/organisation-settings.queries';

export function useTwoStepSection(organisationId: string) {
  const requireTotp = useRequireTotpMutation(organisationId);
  // The section shows only to Owners, who may list the team.
  const members = useMembersQuery(organisationId, true);
  // Switching the requirement off weakens every admin's login, so it waits for a confirmation.
  const [isConfirmingOff, setConfirmingOff] = useState(false);

  return {
    // Null until the team is known.
    withoutTotp: members.data === undefined ? null : members.data.filter((member) => !member.totpEnabled).length,
    isSaving: requireTotp.isPending,
    hasFailed: requireTotp.isError,
    setRequired: (required: boolean) => (required ? requireTotp.mutate(true) : setConfirmingOff(true)),
    isConfirmingOff,
    setConfirmingOff,
    switchOff: () => requireTotp.mutate(false, { onSuccess: () => setConfirmingOff(false) }),
  };
}
