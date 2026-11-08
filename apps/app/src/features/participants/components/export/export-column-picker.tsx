import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ExportDownload } from '@/features/participants/components/export/export-download';
import type { useParticipantExport } from '@/features/participants/components/export/use-participant-export.hook';

interface ExportColumnPickerProps {
  organisationId: string;
  turnusId: string;
  campId: string | null;
  exporting: ReturnType<typeof useParticipantExport>;
  presets: NonNullable<ReturnType<typeof useParticipantExport>['options']>['presets'];
}

// The columns to export, the shared presets to start from, and saving the choice as a preset.
export function ExportColumnPicker({ organisationId, turnusId, campId, exporting, presets }: ExportColumnPickerProps) {
  const { t } = useTranslation('participants');

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-border-subtle p-4 text-sm">
      {presets.length === 0 ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{t('export.presets')}</span>
          {presets.map((preset) => (
            <span key={preset.id} className="inline-flex items-center rounded-full border border-control bg-card">
              <button
                type="button"
                className="h-9 cursor-pointer rounded-l-full pr-1 pl-3.5 font-semibold transition-colors hover:bg-muted"
                onClick={() => exporting.choose(preset.columns)}
              >
                {preset.name}
              </button>
              <button
                type="button"
                aria-label={t('export.removePreset', { name: preset.name })}
                className="flex size-9 cursor-pointer items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => exporting.removePreset(preset.id)}
              >
                <XIcon aria-hidden="true" className="size-4" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        {exporting.every.map((id) => (
          <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3">
            <Checkbox
              checked={exporting.selection.includes(id)}
              onCheckedChange={(checked) => exporting.toggleColumn(id, checked)}
            />
            {exporting.labelOf(id)}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-border-subtle pt-4">
        <ExportDownload
          organisationId={organisationId}
          request={{ kind: 'participants', turnusId, columns: [...exporting.selection] }}
          label={t('export.startChosen')}
          disabled={exporting.selection.length === 0}
        />
        {campId === null ? null : (
          <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
            <label className="flex flex-col gap-1.5 font-semibold">
              {t('export.presetName')}
              <Input value={exporting.presetName} onChange={(event) => exporting.setPresetName(event.target.value)} />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={!exporting.canSavePreset}
              onClick={() => exporting.savePreset(campId)}
            >
              {t('export.savePreset')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
