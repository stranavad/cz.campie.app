import { queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AuditLogQuery,
  GrantSupportAccessBody,
  OrganisationSettings,
  PaymentGatewaySettings,
  SetPaymentGatewayKeysBody,
  UpdateOrganisationSettingsBody,
} from '@repo/schema/organisations';

import { accountKeys } from '@/core/account';
import { organisationSettingsKeys } from '@/features/organisation-settings/api/organisation-settings.keys';
import { organisationSettingsService } from '@/features/organisation-settings/api/organisation-settings.service';

export const organisationSettingsQueryOptions = (organisationId: string) =>
  queryOptions({
    queryKey: organisationSettingsKeys.detail(organisationId),
    queryFn: ({ signal }) => organisationSettingsService.get(organisationId, signal),
  });

// Disabled until the admin is known to be an Owner of the Organisation, since anyone else is refused.
export const useOrganisationSettingsQuery = (organisationId: string, enabled: boolean) =>
  useQuery({ ...organisationSettingsQueryOptions(organisationId), enabled });

// Every change answers with the settings as they now are; the account shows the display name too.
function useSettingsMutation<Variables>(
  organisationId: string,
  mutationFn: (variables: Variables) => Promise<OrganisationSettings>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (settings) => {
      queryClient.setQueryData(organisationSettingsKeys.detail(organisationId), settings);
      await queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export const useUpdateOrganisationSettingsMutation = (organisationId: string) =>
  useSettingsMutation(organisationId, (body: UpdateOrganisationSettingsBody) =>
    organisationSettingsService.update(organisationId, body),
  );

export const useSetOrganisationLogoMutation = (organisationId: string) =>
  useSettingsMutation(organisationId, (file: File) => organisationSettingsService.setLogo(organisationId, file));

export const useRemoveOrganisationLogoMutation = (organisationId: string) =>
  useSettingsMutation<void>(organisationId, () => organisationSettingsService.removeLogo(organisationId));

export const useRequireTotpMutation = (organisationId: string) =>
  useSettingsMutation(organisationId, (required: boolean) =>
    organisationSettingsService.requireTotp(organisationId, required),
  );

export const usePaymentGatewayQuery = (organisationId: string) =>
  useQuery({
    queryKey: organisationSettingsKeys.paymentGateway(organisationId),
    queryFn: ({ signal }) => organisationSettingsService.paymentGateway(organisationId, signal),
  });

function usePaymentGatewayMutation<Variables>(
  organisationId: string,
  mutationFn: (variables: Variables) => Promise<PaymentGatewaySettings>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (settings) =>
      queryClient.setQueryData(organisationSettingsKeys.paymentGateway(organisationId), settings),
  });
}

export const useSetPaymentGatewayKeysMutation = (organisationId: string) =>
  usePaymentGatewayMutation(organisationId, (body: SetPaymentGatewayKeysBody) =>
    organisationSettingsService.setPaymentGatewayKeys(organisationId, body),
  );

export const useRemovePaymentGatewayKeysMutation = (organisationId: string) =>
  usePaymentGatewayMutation<void>(organisationId, () =>
    organisationSettingsService.removePaymentGatewayKeys(organisationId),
  );

export const useSupportGrantsQuery = (organisationId: string) =>
  useQuery({
    queryKey: organisationSettingsKeys.supportAccess(organisationId),
    queryFn: ({ signal }) => organisationSettingsService.supportGrants(organisationId, signal),
  });

export const useSupportAccessMutations = (organisationId: string) => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: organisationSettingsKeys.supportAccess(organisationId) });

  return {
    grant: useMutation({
      mutationFn: (body: GrantSupportAccessBody) => organisationSettingsService.grantSupport(organisationId, body),
      onSuccess: refresh,
    }),
    revoke: useMutation({
      mutationFn: (grantId: string) => organisationSettingsService.revokeSupport(organisationId, grantId),
      onSuccess: refresh,
    }),
  };
};

// The log a page at a time, each page asking for the one after its last entry.
export const useAuditLogQuery = (organisationId: string, filters: Omit<AuditLogQuery, 'after'>, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: [...organisationSettingsKeys.detail(organisationId), 'audit-log', filters],
    queryFn: ({ signal, pageParam }) =>
      organisationSettingsService.auditLog(
        organisationId,
        { ...filters, ...(pageParam === null ? {} : { after: pageParam }) },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next,
    enabled,
  });
