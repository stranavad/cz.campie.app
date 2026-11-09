import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { useTurnusyOccupancy } from '@/features/admin-home/components/use-turnusy-occupancy.hook';

interface TurnusyOccupancyProps {
  organisationId: string;
}

// How full every coming Turnus is, one bar each.
export function TurnusyOccupancy({ organisationId }: TurnusyOccupancyProps) {
  const { t } = useTranslation('adminHome');
  const rows = useTurnusyOccupancy(organisationId);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('turnusy.title')}</CardTitle>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
        {rows.map((row) => (
          <Meter key={row.id} label={row.label} value={row.registered} max={row.capacity} valueLabel={row.value} />
        ))}
      </div>
    </Card>
  );
}
