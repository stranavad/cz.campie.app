import { useTranslation } from 'react-i18next';

import type { PermissionLevel } from '@repo/schema/admins';

import { Badge } from '@/components/ui/badge';
import { LEVEL_CHIP_VARIANT } from '@/features/members/components/member-table/level-chip.constant';

interface LevelChipProps {
  level: PermissionLevel;
}

// A member's level in one permission area.
export function LevelChip({ level }: LevelChipProps) {
  const { t } = useTranslation('members');

  return <Badge variant={LEVEL_CHIP_VARIANT[level]}>{t(`levels.${level}`)}</Badge>;
}
