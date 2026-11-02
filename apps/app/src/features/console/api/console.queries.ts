import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RenameOrganisationSubdomainBody } from '@repo/schema/console';

import { accountKeys } from '@/core/account';
import { consoleKeys } from '@/features/console/api/console.keys';
import { consoleService } from '@/features/console/api/console.service';

export const consoleOrganisationsQueryOptions = () =>
  queryOptions({
    queryKey: consoleKeys.organisations(),
    queryFn: ({ signal }) => consoleService.listOrganisations(signal),
  });

// Disabled until the account shows a session that passed TOTP, since the console refuses anything less.
export const useConsoleOrganisationsQuery = (enabled: boolean) =>
  useQuery({ ...consoleOrganisationsQueryOptions(), enabled });

// Every console action changes the list.
const useOrganisationMutation = <Variables, Result>(mutationFn: (variables: Variables) => Promise<Result>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consoleKeys.organisations() }),
  });
};

export const useApproveOrganisationMutation = () => useOrganisationMutation(consoleService.approve);

export const useSuspendOrganisationMutation = () => useOrganisationMutation(consoleService.suspend);

export const useRejectOrganisationMutation = () => useOrganisationMutation(consoleService.reject);

export const useRenameOrganisationMutation = () =>
  useOrganisationMutation(
    ({ organisationId, body }: { organisationId: string; body: RenameOrganisationSubdomainBody }) =>
      consoleService.rename(organisationId, body),
  );

export const useStartTotpEnrolmentMutation = () => useMutation({ mutationFn: consoleService.startTotpEnrolment });

// A passed code changes the account's TOTP and session state, which decides what the console shows.
const useTotpCodeMutation = (mutationFn: (body: { code: string }) => Promise<void>) => {
  const queryClient = useQueryClient();

  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }) });
};

export const useConfirmTotpEnrolmentMutation = () => useTotpCodeMutation(consoleService.confirmTotpEnrolment);

export const useVerifyTotpMutation = () => useTotpCodeMutation(consoleService.verifyTotp);
