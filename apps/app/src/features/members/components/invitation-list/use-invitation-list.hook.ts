import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Invitation } from '@repo/schema/admins';

import { useRevokeInvitationMutation } from '@/features/members/api/members.queries';

export function useInvitationList(organisationId: string, invitations: Invitation[]) {
  const { t, i18n } = useTranslation('members');
  const revoke = useRevokeInvitationMutation(organisationId);
  const [renderedAt] = useState(() => Date.now());

  const rows = invitations.map((invitation) => {
    const granted = PERMISSION_AREAS.filter((area) => invitation.permissions[area] !== 'none').map(
      (area) => `${t(`areas.${area}`)}: ${t(`levels.${invitation.permissions[area]}`)}`,
    );

    const expiresAt = new Date(invitation.expiresAt);

    return {
      id: invitation.id,
      email: invitation.email,
      permissions: granted.length === 0 ? t('levels.none') : granted.join(', '),
      // An expired one stays until it is revoked or sent again.
      validity:
        expiresAt.getTime() <= renderedAt
          ? t('invitations.expired')
          : t('invitations.expires', { date: expiresAt.toLocaleDateString(i18n.language) }),
    };
  });

  return {
    rows,
    isRevoking: revoke.isPending,
    hasFailed: revoke.isError,
    revoke: (invitationId: string) => revoke.mutate(invitationId),
  };
}
