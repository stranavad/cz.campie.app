import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

// How a Turnus is named in a list of choices across Camps: its Camp, its name and its start.
export function useTurnusOptionLabel() {
  const { t } = useTranslation();

  return (turnus: { campName: string; name: string; startDate: string }) =>
    t('selectedTurnus.option', { camp: turnus.campName, turnus: turnus.name, date: czechDate(turnus.startDate) });
}
