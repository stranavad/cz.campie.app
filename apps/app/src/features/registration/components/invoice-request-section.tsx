import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { Card, CardTitle } from '@/components/ui/card';
import { InvoiceRequestFields } from '@/core/invoice-request';
import type { InvoiceRequestState } from '@/features/registration/components/use-invoice-request.hook';

interface InvoiceRequestSectionProps {
  invoice: InvoiceRequestState;
  // What the server refused about the Invoice request as a whole or its amount.
  refusal: string | null;
}

// Part or all of the price invoiced to a company, such as the guardian's employer, while the Camp offers it.
export function InvoiceRequestSection({ invoice, refusal }: InvoiceRequestSectionProps) {
  const { t } = useTranslation('registration');

  return (
    <Card>
      <CardTitle>{t('invoice.title')}</CardTitle>
      <SettingSwitch
        label={t('invoice.wanted')}
        description={t('invoice.wantedHint')}
        checked={invoice.wanted}
        onCheckedChange={invoice.setWanted}
      />
      {invoice.wanted ? <InvoiceRequestFields form={invoice.form} /> : null}
      {refusal === null ? null : <p className="text-sm font-medium text-danger-foreground">{refusal}</p>}
    </Card>
  );
}
