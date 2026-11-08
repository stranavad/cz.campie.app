import { ListChecksIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ExportColumnPicker } from '@/features/participants/components/export/export-column-picker';
import { ExportDownload } from '@/features/participants/components/export/export-download';
import { PaymentsExport } from '@/features/participants/components/export/payments-export';
import { useParticipantExport } from '@/features/participants/components/export/use-participant-export.hook';

interface ParticipantExportProps {
  organisationId: string;
  turnusId: string;
  campId: string | null;
}

// The Turnus's Excel export: every column at once, or the columns chosen, from a shared preset or the last
// choice; and the payments within dates for the accountant.
export function ParticipantExport({ organisationId, turnusId, campId }: ParticipantExportProps) {
  const { t } = useTranslation('participants');
  const exporting = useParticipantExport(organisationId, turnusId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-2">
        <ExportDownload
          organisationId={organisationId}
          request={{ kind: 'participants', turnusId }}
          label={t('export.start')}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={exporting.isPicking}
          onClick={exporting.togglePicking}
        >
          <ListChecksIcon aria-hidden="true" />
          {t('export.pick')}
        </Button>
      </div>
      {exporting.isPicking && exporting.options !== undefined ? (
        <ExportColumnPicker
          organisationId={organisationId}
          turnusId={turnusId}
          campId={campId}
          exporting={exporting}
          presets={exporting.options.presets}
        />
      ) : null}
      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        <p className="text-[15px] font-semibold">{t('export.payments')}</p>
        <PaymentsExport organisationId={organisationId} />
      </div>
    </div>
  );
}
