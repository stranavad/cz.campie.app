import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { useSelectedTurnus } from '@/core/selected-turnus/hooks/use-selected-turnus.hook';

// The Selected Turnus in the admin header, on every page; hidden without Registrations read or Turnusy.
export function TurnusSwitcher() {
  const { t } = useTranslation();
  const { turnusy, turnusId, selectTurnus } = useSelectedTurnus();

  if (turnusy.length === 0) {
    return null;
  }

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t('selectedTurnus.label')}</span>
      <select
        className="h-8 min-w-0 rounded-lg border border-input bg-transparent px-2"
        value={turnusId ?? ''}
        onChange={(event) => selectTurnus(event.target.value)}
      >
        {turnusy.map((turnus) => (
          <option key={turnus.id} value={turnus.id}>
            {t('selectedTurnus.option', {
              camp: turnus.campName,
              turnus: turnus.name,
              date: czechDate(turnus.startDate),
            })}
          </option>
        ))}
      </select>
    </label>
  );
}
