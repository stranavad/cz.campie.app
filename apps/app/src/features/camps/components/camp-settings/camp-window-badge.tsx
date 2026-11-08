import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { useCampWindowStatus } from '@/features/camps/components/camp-settings/use-camp-window-status.hook';

interface CampWindowBadgeProps {
  organisationId: string;
  campId: string;
}

const VARIANTS = { open: 'success', notYetOpen: 'outline', closed: 'neutral' } as const;

export function CampWindowBadge({ organisationId, campId }: CampWindowBadgeProps) {
  const { t } = useTranslation('camps');
  const status = useCampWindowStatus(organisationId, campId);

  if (status === null) {
    return null;
  }

  return (
    <Badge variant={VARIANTS[status]} dot>
      {t(`settings.status.${status}`)}
    </Badge>
  );
}
