import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { emailVerificationService } from '@/features/email-verification/api/email-verification.service';

// The signed-in account, if it is the verified one, stops asking for verification.
export const useVerifyEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailVerificationService.verify,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
