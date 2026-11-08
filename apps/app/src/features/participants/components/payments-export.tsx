import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PAYMENTS_EXPORT_ERROR_CODES, startPaymentsExportBodySchema } from '@repo/schema/registrations';
import { pragueDateOf } from '@repo/schema/shared';

import { Input } from '@/components/ui/input';
import { ExportDownload } from '@/features/participants/components/export-download';

/**
 * Name why the dates cannot be exported, or null when they can.
 * @param from the first payment date as entered
 * @param to the last payment date as entered
 */
function problemOf(from: string, to: string): (typeof PAYMENTS_EXPORT_ERROR_CODES)[number] | null {
  const checked = startPaymentsExportBodySchema.safeParse({ from, to });

  if (checked.success) {
    return null;
  }

  // A date left empty is no date at all.
  return (
    PAYMENTS_EXPORT_ERROR_CODES.find((code) => checked.error.issues.some(({ message }) => message === code)) ??
    'date_range_incomplete'
  );
}

// The payments within dates for the accountant, the current calendar year in Prague to begin with.
export function PaymentsExport({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('participants');
  // This year in Prague, read once when the form appears.
  const [year] = useState(() => pragueDateOf(new Date()).slice(0, 4));
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const problem = problemOf(from, to);

  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        {t('export.paidFrom')}
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        {t('export.paidTo')}
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </label>
      <ExportDownload
        organisationId={organisationId}
        request={{ kind: 'payments', from, to }}
        label={t('export.payments')}
        disabled={problem !== null}
      />
      {problem === null ? null : <span className="text-destructive">{t(`export.dateRange.${problem}`)}</span>}
    </div>
  );
}
