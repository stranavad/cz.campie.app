import { useCurrentMembership } from '@/core/account';
import { useOrganisationSettingsQuery } from '@/features/organisation-settings/api/organisation-settings.queries';

export function useOrganisationSettingsPage() {
  const { membership, isLoading, isSignedOut, isError, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const isOwner = membership?.owner === true;
  const settings = useOrganisationSettingsQuery(organisationId, isOwner);

  return {
    organisationId,
    isSignedOut,
    isNotOwner: hasNoMembership || (membership !== undefined && !isOwner),
    isLoading: isLoading || (isOwner && settings.isPending),
    isError: isError || settings.isError,
    settings: settings.data,
  };
}
