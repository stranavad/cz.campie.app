import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate, pragueDateOf } from '@repo/schema/shared';

import { useAllTurnusyQuery } from '@/core/camp-list';

// The Turnusy not yet over, by start, each with its places taken; the Camp named when there are several.
export function useTurnusyOccupancy(organisationId: string) {
  const { t } = useTranslation('adminHome');
  const { camps, turnusy } = useAllTurnusyQuery(organisationId, true);
  // Today in Prague, read once.
  const [today] = useState(() => pragueDateOf(new Date()));
  const campName = (campId: string) => camps.find(({ id }) => id === campId)?.name ?? '';

  return turnusy
    .filter(({ endDate }) => endDate >= today)
    .toSorted((a, b) => a.startDate.localeCompare(b.startDate))
    .map((turnus) => {
      const label = t('turnusy.label', {
        turnus: turnus.name,
        start: czechDate(turnus.startDate),
        end: czechDate(turnus.endDate),
      });

      return {
        id: turnus.id,
        label: camps.length > 1 ? t('turnusy.ofCamp', { camp: campName(turnus.campId), label }) : label,
        registered: turnus.registered,
        capacity: turnus.capacity,
        value: t(turnus.registered >= turnus.capacity ? 'turnusy.full' : 'turnusy.places', {
          registered: turnus.registered,
          capacity: turnus.capacity,
        }),
      };
    });
}
