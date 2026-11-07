import { useCurrentMembership } from '@/core/account';
import { useCampPreviewQuery } from '@/features/camps/api/camps.queries';

export function useCampPreviewPage(campId: string) {
  const { membership, isLoading, isSignedOut } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const preview = useCampPreviewQuery(organisationId, campId, organisationId !== '' && campId !== '');

  return {
    isSignedOut,
    isLoading: isLoading || (membership !== undefined && campId !== '' && preview.isPending),
    preview: preview.data,
  };
}
