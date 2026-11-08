import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FIXED_EXPORT_COLUMNS } from '@repo/schema/registrations';

import { useExportOptionsQuery, usePresetMutations } from '@/features/participants/api/participants.queries';

// The columns chosen for the Turnus's export: from a shared preset, the last choice or every column.
export function useParticipantExport(organisationId: string, turnusId: string) {
  const { t } = useTranslation('participants');
  const [isPicking, setPicking] = useState(false);
  const options = useExportOptionsQuery(organisationId, turnusId, isPicking);
  const presets = usePresetMutations(organisationId, turnusId);
  // null until the admin changes it: the last choice, else every column.
  const [chosen, setChosen] = useState<readonly string[] | null>(null);
  const [presetName, setPresetName] = useState('');
  const formColumns = options.data?.formColumns ?? [];
  const every = [...FIXED_EXPORT_COLUMNS, ...formColumns.map(({ id }) => id)];
  const selection = chosen ?? options.data?.lastSelection ?? every;
  const labelOf = (id: string) => {
    const form = formColumns.find((column) => column.id === id);

    if (form === undefined) {
      return t(`export.columns.${id}`, { defaultValue: id });
    }

    const label = form.label ?? (form.labelKey === null ? id : t(form.labelKey, { ns: 'common', defaultValue: id }));

    return form.removed ? t('export.removed', { label }) : label;
  };

  return {
    isPicking,
    togglePicking: () => setPicking(!isPicking),
    options: options.data,
    every,
    selection,
    labelOf,
    choose: setChosen,
    toggleColumn: (id: string, on: boolean) =>
      setChosen(on ? [...selection, id] : selection.filter((known) => known !== id)),
    presetName,
    setPresetName,
    canSavePreset: presetName.trim() !== '' && selection.length > 0 && !presets.save.isPending,
    savePreset: (campId: string) =>
      presets.save.mutate(
        { campId, name: presetName, columns: [...selection] },
        { onSuccess: () => setPresetName('') },
      ),
    removePreset: (presetId: string) => presets.remove.mutate(presetId),
  };
}
