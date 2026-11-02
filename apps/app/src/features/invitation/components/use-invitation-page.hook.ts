import { useInvitationPreviewQuery } from '@/features/invitation/api/invitation.queries';
import { HttpError } from '@/lib/api';

export function useInvitationPage(token: string) {
  const preview = useInvitationPreviewQuery(token);
  const isInvalid = token === '' || (preview.error instanceof HttpError && preview.error.code === 'invitation_invalid');

  return {
    isInvalid,
    isLoading: !isInvalid && preview.isPending,
    isError: !isInvalid && preview.isError,
    preview: preview.data,
  };
}
