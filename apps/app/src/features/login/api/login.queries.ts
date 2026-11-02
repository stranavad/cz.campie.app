import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { loginService } from '@/features/login/api/login.service';

// The account is fetched afresh before the mutation settles, so the admin home opens signed in.
export const useLogInMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginService.logIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
