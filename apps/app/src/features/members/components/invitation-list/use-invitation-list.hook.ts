import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Invitation } from '@repo/schema/admins';

import { useInviteMutation, useRevokeInvitationMutation } from '@/features/members/api/members.queries';

export function useInvitationList(organisationId: string, invitations: Invitation[]) {
  const { t, i18n } = useTranslation('members');
  const revoke = useRevokeInvitationMutation(organisationId);
  // Inviting the same address again replaces the invitation with a new link and validity.
  const resend = useInviteMutation(organisationId);
  const [renderedAt] = useState(() => Date.now());

  const rows = invitations.map((invitation) => {
    const granted = PERMISSION_AREAS.filter((area) => invitation.permissions[area] !== 'none').map((area) =>
      t('members.permission', { area: t(`areas.${area}`), level: t(`levels.${invitation.permissions[area]}`) }),
    );

    const expiresAt = new Date(invitation.expiresAt);

    return {
      id: invitation.id,
      email: invitation.email,
      permissions: granted.length === 0 ? t('levels.none') : granted.join(', '),
      validity:
        expiresAt.getTime() <= renderedAt
          ? t('invitations.expired')
          : t('invitations.expires', { date: expiresAt.toLocaleDateString(i18n.language) }),
    };
  });

  return {
    rows,
    isBusy: revoke.isPending || resend.isPending,
    failure: revoke.isError ? 'revoke' : resend.isError ? 'resend' : null,
    resentTo: resend.data?.email ?? null,
    revoke: (invitationId: string) => {
      resend.reset();
      revoke.mutate(invitationId);
    },
    resend: (invitationId: string) => {
      const invitation = invitations.find(({ id }) => id === invitationId);

      revoke.reset();

      if (invitation !== undefined) {
        resend.mutate({ email: invitation.email, permissions: invitation.permissions });
      }
    },
  } as const;
}
