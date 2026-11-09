import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { signupKeys } from '@/features/signup/api/signup.keys';
import { signupService } from '@/features/signup/api/signup.service';

// Signup signs the Owner in, so the account is fetched afresh before the mutation settles.
export const useSignUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signupService.signUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

// Whether a subdomain is free, none asked while null. The API counts each check against the address's
// signup limit, so a refusal is not retried and an answer is kept for the form's lifetime.
export const useSubdomainAvailabilityQuery = (subdomain: string | null) =>
  useQuery({
    queryKey: signupKeys.subdomain(subdomain ?? ''),
    queryFn: subdomain === null ? skipToken : ({ signal }) => signupService.checkSubdomain(subdomain, signal),
    retry: false,
    staleTime: Infinity,
  });
