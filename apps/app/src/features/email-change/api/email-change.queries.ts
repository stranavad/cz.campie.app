import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { emailChangeService } from '@/features/email-change/api/email-change.service';

// The signed-in account, if it is the changed one, shows its new email.
export const useConfirmEmailChangeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailChangeService.confirm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
