import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Invitation } from '@repo/schema/admins';

import { personNameWithEmail, usePermissionSummary } from '@/core/account';
import { useInviteMutation, useRevokeInvitationMutation } from '@/features/members/api/members.queries';

export function useInvitationList(organisationId: string, invitations: Invitation[]) {
  const { t, i18n } = useTranslation('members');
  const revoke = useRevokeInvitationMutation(organisationId);
  // Inviting the same address again replaces the invitation with a new link and validity.
  const resend = useInviteMutation(organisationId);
  const [renderedAt] = useState(() => Date.now());
  const permissionsOf = usePermissionSummary();

  const rows = invitations.map((invitation) => {
    const expiresAt = new Date(invitation.expiresAt);
    const sentOn = new Date(invitation.sentAt).toLocaleDateString(i18n.language);

    return {
      id: invitation.id,
      email: invitation.email,
      sent:
        invitation.invitedBy === null
          ? t('invitations.sent', { date: sentOn })
          : t('invitations.sentBy', { name: personNameWithEmail(invitation.invitedBy), date: sentOn }),
      permissions: permissionsOf(invitation.permissions),
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
