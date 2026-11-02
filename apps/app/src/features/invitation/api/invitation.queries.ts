import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account';
import { invitationKeys } from '@/features/invitation/api/invitation.keys';
import { invitationService } from '@/features/invitation/api/invitation.service';

export const invitationPreviewQueryOptions = (token: string) =>
  queryOptions({
    queryKey: invitationKeys.preview(token),
    queryFn: ({ signal }) => invitationService.lookUp(token, signal),
    // Read once: accepting uses the link up, and a refetch then would show it as invalid.
    staleTime: Infinity,
  });

export const useInvitationPreviewQuery = (token: string) =>
  useQuery({ ...invitationPreviewQueryOptions(token), enabled: token !== '' });

// A new account is signed in by accepting, so the account is refetched.
export const useAcceptInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invitationService.accept,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
