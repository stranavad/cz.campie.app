import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useParticipantExportQuery, useStartExportMutation } from '@/features/participants/api/participants.queries';

// Starts an Excel export of the Turnus and offers its file once the job has made it.
export function ParticipantExport({ organisationId, turnusId }: { organisationId: string; turnusId: string }) {
  const { t } = useTranslation('participants');
  const start = useStartExportMutation(organisationId);
  const [exportId, setExportId] = useState<string | null>(null);
  const current = useParticipantExportQuery(organisationId, exportId);
  const file = current.data?.file ?? null;
  const isWorking = start.isPending || (exportId !== null && file === null && !current.isError && !current.gaveUp);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isWorking}
        onClick={() =>
          start.mutate(turnusId, {
            onSuccess: (started) => setExportId(started.id),
          })
        }
      >
        {isWorking ? t('export.working') : t('export.start')}
      </Button>
      {file === null ? null : (
        <a href={file.url} download className="underline">
          {t('export.download')}
        </a>
      )}
      {start.isError || current.isError ? <span className="text-destructive">{t('export.error')}</span> : null}
      {current.gaveUp ? <span className="text-muted-foreground">{t('export.slow')}</span> : null}
    </div>
  );
}
