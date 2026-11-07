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

// The Přihláška links last five minutes, so the Registrations are fetched again before they run out.
const LINK_REFRESH_MS = 4 * 60 * 1000;

export const useGuardianRegistrationsQuery = () =>
  useQuery({
    queryKey: portalKeys.registrations(),
    queryFn: ({ signal }) => portalService.registrations(signal),
    refetchInterval: LINK_REFRESH_MS,
    retry: false,
  });
