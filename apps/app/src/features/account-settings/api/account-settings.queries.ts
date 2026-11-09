import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { accountSettingsService } from '@/features/account-settings/api/account-settings.service';

// The name shows in the sidebar, the greeting and the member lists, all read from the account.
export const useRenameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountSettingsService.rename,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

export const useChangePasswordMutation = () => useMutation({ mutationFn: accountSettingsService.changePassword });

// Nothing changes until the link mailed to the new address is followed.
export const useRequestEmailChangeMutation = () =>
  useMutation({ mutationFn: accountSettingsService.requestEmailChange });

export const useStartTotpReplacementMutation = () =>
  useMutation({ mutationFn: accountSettingsService.startTotpReplacement });

export const useConfirmTotpReplacementMutation = () =>
  useMutation({ mutationFn: accountSettingsService.confirmTotpReplacement });
