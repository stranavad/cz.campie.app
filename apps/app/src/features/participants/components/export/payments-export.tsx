import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PAYMENTS_EXPORT_ERROR_CODES, startPaymentsExportBodySchema } from '@repo/schema/registrations';
import { pragueDateOf } from '@repo/schema/shared';

import { DatePicker } from '@/components/date-picker/date-picker';
import { ExportDownload } from '@/features/participants/components/export/export-download';

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

interface PaymentsExportProps {
  organisationId: string;
}

// The payments within dates for the accountant, the current calendar year in Prague to begin with.
export function PaymentsExport({ organisationId }: PaymentsExportProps) {
  const { t } = useTranslation('participants');
  // This year in Prague, read once when the form appears.
  const [year] = useState(() => pragueDateOf(new Date()).slice(0, 4));
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const problem = problemOf(from, to);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-col gap-1.5 font-semibold">
          {t('export.paidFrom')}
          <DatePicker value={from} onChange={setFrom} />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 font-semibold">
          {t('export.paidTo')}
          <DatePicker value={to} onChange={setTo} />
        </label>
      </div>
      {problem === null ? null : (
        <p role="alert" className="text-destructive">
          {t(`export.dateRange.${problem}`)}
        </p>
      )}
      <ExportDownload
        organisationId={organisationId}
        request={{ kind: 'payments', from, to }}
        label={t('export.paymentsStart')}
        disabled={problem !== null}
      />
    </div>
  );
}
