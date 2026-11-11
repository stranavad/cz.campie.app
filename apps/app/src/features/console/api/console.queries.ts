import { queryOptions, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export const useOrganisationPreviewQuery = (organisationId: string) =>
  useQuery({
    queryKey: consoleKeys.preview(organisationId),
    queryFn: organisationId === '' ? skipToken : ({ signal }) => consoleService.preview(organisationId, signal),
    retry: false,
  });

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

// Records the entry in the Organisation's log; the account then shows it entered, and the admin pages act
// in it under the grant.
export const useEnterSupportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organisationId: string) => consoleService.enterSupport(organisationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

const problemReportsKey = ['console', 'problem-reports'] as const;

// Disabled, like the list, until the console is open to this session.
export const useProblemReportsQuery = (enabled: boolean) =>
  useQuery({ queryKey: problemReportsKey, queryFn: ({ signal }) => consoleService.problemReports(signal), enabled });

export const useResolveProblemReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => consoleService.resolveProblemReport(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: problemReportsKey }),
  });
};
