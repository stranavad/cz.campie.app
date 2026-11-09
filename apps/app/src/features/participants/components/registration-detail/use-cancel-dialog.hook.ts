import { useState } from 'react';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { useCancelAllMutation, useCancelParticipantMutation } from '@/features/participants/api/participants.queries';

// Cancelling one child or all of them; each cancellation waits for a second click on its confirmation.
export function useCancelDialog(organisationId: string, detail: RegistrationDetail) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const cancel = useCancelParticipantMutation(organisationId, detail.id);
  const cancelAll = useCancelAllMutation(organisationId, detail.id);
  // What waits for its second click: a child's id, or 'all'.
  const confirmThen = (key: string, act: () => void) => {
    if (confirming === key) {
      setConfirming(null);
      act();
    } else {
      setConfirming(key);
    }
  };

  return {
    isConfirming: (key: string) => confirming === key,
    isCancelling: cancel.isPending,
    cancelParticipant: (participantId: string) => confirmThen(participantId, () => cancel.mutate(participantId)),
    // Cancelling all is offered while more than one child is still registered.
    canCancelAll: detail.participants.filter(({ status }) => status === 'registered').length > 1,
    isCancellingAll: cancelAll.isPending,
    cancelAll: () => confirmThen('all', () => cancelAll.mutate()),
  };
}
