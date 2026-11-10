import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';

interface InvoiceCellProps {
  invoice: ParticipantRow['invoice'];
}

// A Registration's Invoice request at a glance: its state, and what the company still owes.
export function InvoiceCell({ invoice }: InvoiceCellProps) {
  const { t } = useTranslation('participants');

  if (invoice === null) {
    return <span className="text-muted-foreground">{t('row.none')}</span>;
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <Badge variant={invoice.state === 'to_invoice' ? 'warning' : 'success'}>
        {t(`invoiceState.${invoice.state}`)}
      </Badge>
      {invoice.companyBalance > 0 ? (
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {t('invoiceState.companyLeft', { amount: czk(invoice.companyBalance) })}
        </span>
      ) : null}
    </span>
  );
}
