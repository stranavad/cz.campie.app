import { usePermissionSummary } from '@/core/account';
import { useInvitationPreviewQuery } from '@/features/invitation/api/invitation.queries';
import { HttpError } from '@/lib/api';

export function useInvitationPage(token: string) {
  const preview = useInvitationPreviewQuery(token);
  const permissionsOf = usePermissionSummary();
  const isInvalid = token === '' || (preview.error instanceof HttpError && preview.error.code === 'invitation_invalid');
  const invitedBy = preview.data?.invitedBy ?? null;

  return {
    isInvalid,
    isLoading: !isInvalid && preview.isPending,
    isError: !isInvalid && preview.isError,
    preview: preview.data,
    inviter: invitedBy === null ? null : `${invitedBy.firstName} ${invitedBy.lastName}`,
    permissions: preview.data === undefined ? '' : permissionsOf(preview.data.permissions),
  };
}
