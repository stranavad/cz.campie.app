import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Permissions } from '@repo/schema/admins';

/**
 * Summarise levels as the areas they open, "Přihlášky: upravit · Zdravotní údaje: číst", for a membership or
 * an invitation.
 */
export function usePermissionSummary() {
  const { t } = useTranslation();

  return (permissions: Permissions) => {
    const granted = PERMISSION_AREAS.filter((area) => permissions[area] !== 'none').map((area) =>
      t('permissions.summary', {
        area: t(`permissions.areas.${area}`),
        level: t(`permissions.levels.${permissions[area]}`),
      }),
    );

    return granted.length === 0 ? t('permissions.noAccess') : granted.join(' · ');
  };
}
