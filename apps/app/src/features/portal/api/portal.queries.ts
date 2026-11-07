import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { portalKeys } from '@/features/portal/api/portal.keys';
import { portalService } from '@/features/portal/api/portal.service';

export const useRequestLoginLinkMutation = () => useMutation({ mutationFn: portalService.requestLink });

export const useGuardianSignInMutation = () => useMutation({ mutationFn: portalService.signIn });

export const useGuardianSignOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: portalService.signOut,
    onSettled: () => queryClient.removeQueries({ queryKey: portalKeys.all }),
  });
};

export const useGuardianRegistrationsQuery = () =>
  useQuery({
    queryKey: portalKeys.registrations(),
    queryFn: ({ signal }) => portalService.registrations(signal),
    retry: false,
  });
