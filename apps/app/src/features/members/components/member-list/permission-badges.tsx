import { useTranslation } from 'react-i18next';

import { PERMISSION_AREAS, type Permissions } from '@repo/schema/admins';

import { Badge } from '@/components/ui/badge';

interface PermissionBadgesProps {
  permissions: Permissions;
}

// The areas a member may work in, at a glance: filled for changes, outlined for reading only.
export function PermissionBadges({ permissions }: PermissionBadgesProps) {
  const { t } = useTranslation('members');
  const granted = PERMISSION_AREAS.filter((area) => permissions[area] !== 'none');

  if (granted.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {t('levels.none')}
      </Badge>
    );
  }

  return granted.map((area) => (
    <Badge key={area} variant={permissions[area] === 'write' ? 'neutral' : 'outline'}>
      {t('members.permission', { area: t(`areas.${area}`), level: t(`levels.${permissions[area]}`) })}
    </Badge>
  ));
}
