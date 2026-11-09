import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { usePermissionSummary } from '@/core/account';

export function useAccountMemberships(memberships: Account['memberships']) {
  const { t } = useTranslation();
  const permissionsOf = usePermissionSummary();

  return memberships.map(({ organisation, owner, support, permissions }) => ({
    id: organisation.id,
    name: organisation.displayName,
    role:
      support !== null
        ? t('platformShell.role.support')
        : owner
          ? t('platformShell.role.owner')
          : permissionsOf(permissions),
  }));
}
