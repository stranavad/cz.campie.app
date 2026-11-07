import { createContext, useContext } from 'react';

// Shows freshly made recovery codes above every page until the admin confirms they saved them, so a refetch
// of the account, which ends the setup that made them, does not lose them.
export type ShowRecoveryCodes = (codes: string[]) => void;

export const RecoveryCodesContext = createContext<ShowRecoveryCodes | null>(null);

export function useShowRecoveryCodes(): ShowRecoveryCodes {
  const show = useContext(RecoveryCodesContext);

  if (show === null) {
    throw new Error('useShowRecoveryCodes needs the TwoStepGate above it');
  }

  return show;
}
