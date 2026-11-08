import { useTranslation } from 'react-i18next';

import { Select } from '@/components/ui/select';
import { useSelectedTurnus } from '@/core/selected-turnus/hooks/use-selected-turnus.hook';
import { useTurnusOptionLabel } from '@/core/selected-turnus/hooks/use-turnus-option-label.hook';

// The Selected Turnus as a pill in a page header (overview, registrations); hidden without Registrations
// read or Turnusy. The pill shows the Turnus's name; the list adds its Camp and start.
export function TurnusSwitcher() {
  const { t } = useTranslation();
  const { turnusy, turnusId, selectTurnus } = useSelectedTurnus();
  const optionLabel = useTurnusOptionLabel();

  if (turnusy.length === 0) {
    return null;
  }

  return (
    <Select
      variant="pill"
      aria-label={t('selectedTurnus.label')}
      value={turnusId}
      onValueChange={selectTurnus}
      options={turnusy.map((turnus) => ({ value: turnus.id, label: optionLabel(turnus) }))}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />
      <span className="min-w-0 flex-1 truncate">{turnusy.find((turnus) => turnus.id === turnusId)?.name ?? ''}</span>
    </Select>
  );
}
