import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  useParticipantExportQuery,
  useStartExportMutation,
  type ExportRequest,
} from '@/features/participants/api/participants.queries';

interface ExportDownloadProps {
  organisationId: string;
  request: ExportRequest;
  label: string;
  disabled?: boolean;
}

// Starts an export and offers its file once the job has made it.
export function ExportDownload({ organisationId, request, label, disabled = false }: ExportDownloadProps) {
  const { t } = useTranslation('participants');
  const start = useStartExportMutation(organisationId);
  const [exportId, setExportId] = useState<string | null>(null);
  const current = useParticipantExportQuery(organisationId, exportId);
  const file = current.data?.file ?? null;
  const expired = current.data?.status === 'expired';
  const isWorking =
    start.isPending || (exportId !== null && file === null && !expired && !current.isError && !current.gaveUp);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || isWorking}
        onClick={() => start.mutate(request, { onSuccess: (started) => setExportId(started.id) })}
      >
        {isWorking ? t('export.working') : label}
      </Button>
      {file === null ? null : (
        <a href={file.url} download className="underline">
          {t('export.download')}
        </a>
      )}
      {start.isError || current.isError ? <span className="text-destructive">{t('export.error')}</span> : null}
      {current.gaveUp ? <span className="text-muted-foreground">{t('export.slow')}</span> : null}
      {expired ? <span className="text-muted-foreground">{t('export.expired')}</span> : null}
    </div>
  );
}
