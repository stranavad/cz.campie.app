import { useId, useState } from 'react';

import type { GuardianRegistration } from '@repo/schema/portal';

import { useStartPortalCardPaymentMutation } from '@/features/portal/api/portal.queries';

/**
 * The card payment of a Registration and the transfer details beside it.
 * @param registration the guardian's Registration
 */
export function usePaymentActions(registration: GuardianRegistration) {
  const start = useStartPortalCardPaymentMutation(registration.id);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return {
    transferId: useId(),
    isTransferOpen,
    toggleTransfer: () => setIsTransferOpen(!isTransferOpen),
    // Stays busy after success too: the browser is on its way to the gateway.
    isStarting: start.isPending || start.isSuccess,
    hasFailed: start.isError,
    canTransfer: registration.payment.account !== null,
    payDue: () => start.mutate('due_now'),
    payAll: () => start.mutate('balance'),
  };
}
