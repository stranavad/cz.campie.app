import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FIXED_EXPORT_COLUMNS } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExportOptionsQuery, usePresetMutations } from '@/features/participants/api/participants.queries';
import { ExportDownload } from '@/features/participants/components/export-download';
import { PaymentsExport } from '@/features/participants/components/payments-export';

interface ParticipantExportProps {
  organisationId: string;
  turnusId: string;
  campId: string | null;
}

// The Turnus's Excel export: every column at once, or the columns chosen, from a shared preset or the last
// choice; and the payments within dates for the accountant.
export function ParticipantExport({ organisationId, turnusId, campId }: ParticipantExportProps) {
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

    const label =
      form.label ?? (form.labelKey === null ? id : t(form.labelKey, { ns: 'registration', defaultValue: id }));

    return form.removed ? t('export.removed', { label }) : label;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <ExportDownload
          organisationId={organisationId}
          request={{ kind: 'participants', turnusId }}
          label={t('export.start')}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => setPicking(!isPicking)}>
          {t('export.pick')}
        </Button>
      </div>
      <PaymentsExport organisationId={organisationId} />
      {isPicking && options.data !== undefined ? (
        <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
          {options.data.presets.length === 0 ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{t('export.presets')}</span>
              {options.data.presets.map((preset) => (
                <span key={preset.id} className="flex items-center gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => setChosen(preset.columns)}>
                    {preset.name}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t('export.removePreset', { name: preset.name })}
                    onClick={() => presets.remove.mutate(preset.id)}
                  >
                    {t('export.remove')}
                  </Button>
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {every.map((id) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selection.includes(id)}
                  onChange={(event) =>
                    setChosen(event.target.checked ? [...selection, id] : selection.filter((known) => known !== id))
                  }
                />
                {labelOf(id)}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <ExportDownload
              organisationId={organisationId}
              request={{ kind: 'participants', turnusId, columns: [...selection] }}
              label={t('export.startChosen')}
              disabled={selection.length === 0}
            />
            {campId === null ? null : (
              <>
                <label className="flex flex-col gap-1">
                  {t('export.presetName')}
                  <Input value={presetName} onChange={(event) => setPresetName(event.target.value)} />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={presetName.trim() === '' || selection.length === 0 || presets.save.isPending}
                  onClick={() =>
                    presets.save.mutate(
                      { campId, name: presetName, columns: [...selection] },
                      { onSuccess: () => setPresetName('') },
                    )
                  }
                >
                  {t('export.savePreset')}
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
