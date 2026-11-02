import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { signupService } from '@/features/signup/api/signup.service';

// Signup signs the Owner in, so the account is fetched afresh before the mutation settles.
export const useSignUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signupService.signUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
