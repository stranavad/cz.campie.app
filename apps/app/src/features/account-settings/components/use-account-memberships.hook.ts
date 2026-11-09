import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Account } from '@repo/schema/admins';

export function useAccountMemberships(memberships: Account['memberships']) {
  const { t } = useTranslation();

  // A member's areas they may work in, "Přihlášky: upravit · Zdravotní údaje: číst".
  const permissionsOf = (permissions: Account['memberships'][number]['permissions']) => {
    const granted = PERMISSION_AREAS.filter((area) => permissions[area] !== 'none').map((area) =>
      t('accountSettings.permission', {
        area: t(`accountSettings.areas.${area}`),
        level: t(`accountSettings.levels.${permissions[area]}`),
      }),
    );

    return granted.length === 0 ? t('accountSettings.noAccess') : granted.join(' · ');
  };

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
