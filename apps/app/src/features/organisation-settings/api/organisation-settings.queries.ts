import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OrganisationSettings, UpdateOrganisationSettingsBody } from '@repo/schema/organisations';

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
