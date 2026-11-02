import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { passwordResetService } from '@/features/password-reset/api/password-reset.service';

export const useRequestPasswordResetMutation = () => useMutation({ mutationFn: passwordResetService.request });

// A reset ends every session of the admin, this browser's included.
export const useResetPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: passwordResetService.reset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
