import { useState } from 'react';

import { useGuardianConsentsQuery } from '@/features/portal/api/portal.queries';
import { useSelectedParticipant } from '@/features/portal/components/shared/use-selected-participant.hook';

/**
 * A Registration's Consents by child, and which one is open: the one the guardian opened, else the child's
 * first one still to sign.
 * @param registrationId the guardian's Registration
 */
export function useConsentsPage(registrationId: string) {
  const consents = useGuardianConsentsQuery(registrationId);
  const participants = consents.data?.participants ?? [];
  const { selected, select } = useSelectedParticipant(participants);
  const [opened, setOpened] = useState<{ participantId: string; consentId: string } | null>(null);
  const openId =
    opened !== null && opened.participantId === selected?.id
      ? opened.consentId
      : selected?.consents.find(({ state }) => state === 'unsigned')?.consentId;

  return {
    consents,
    selected,
    select,
    switchParticipants: participants.map(({ id, firstName, consents: list }) => ({
      id,
      firstName,
      left: list.filter(({ state }) => state === 'unsigned').length,
    })),
    isOpen: (consentId: string) => consentId === openId,
    open: (participantId: string, consentId: string) => setOpened({ participantId, consentId }),
  };
}
