import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RenameOrganisationSubdomainBody } from '@repo/schema/console';

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

export const useResetOwnerTotpMutation = (organisationId: string) =>
  useMutation({ mutationFn: (email: string) => consoleService.resetOwnerTotp(organisationId, email) });

// Records the entry in the Organisation's log; the admin pages then act in it under the grant.
export const useEnterSupportMutation = () =>
  useMutation({ mutationFn: (organisationId: string) => consoleService.enterSupport(organisationId) });

const problemReportsKey = ['console', 'problem-reports'] as const;

export const useProblemReportsQuery = () =>
  useQuery({ queryKey: problemReportsKey, queryFn: ({ signal }) => consoleService.problemReports(signal) });

export const useResolveProblemReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => consoleService.resolveProblemReport(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: problemReportsKey }),
  });
};
