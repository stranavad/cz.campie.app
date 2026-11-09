import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEraseRegistrationMutation } from '@/features/participants/api/participants.queries';

// The Owner's erasure: allowed once the confirmation word is typed, in any case and spacing around it.
export function useEraseDialog(organisationId: string, registrationId: string) {
  const { t } = useTranslation('participants');
  const erase = useEraseRegistrationMutation(organisationId, registrationId);
  const [confirmation, setConfirmation] = useState('');
  const word = t('erase.word');

  return {
    word,
    confirmation,
    setConfirmation,
    isDone: erase.isSuccess,
    isError: erase.isError,
    canErase: confirmation.trim().toUpperCase() === word.toUpperCase() && !erase.isPending,
    erase: () => erase.mutate(undefined),
  };
}
