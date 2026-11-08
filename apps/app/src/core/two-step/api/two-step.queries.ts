import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { twoStepService } from '@/core/two-step/api/two-step.service';

export const useStartTotpEnrolmentMutation = () => useMutation({ mutationFn: twoStepService.startEnrolment });

// The account is refetched only once the recovery codes were seen: the new account state ends the setup,
// and with it the page that shows them.
export const useConfirmTotpEnrolmentMutation = () => useMutation({ mutationFn: twoStepService.confirmEnrolment });

export const useRegenerateRecoveryCodesMutation = () =>
  useMutation({ mutationFn: twoStepService.regenerateRecoveryCodes });

// A passed code changes the account's session state, which decides what the pages show.
export const useVerifyTotpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: twoStepService.verify,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

export const useRefreshAccount = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: accountKeys.all });
};
