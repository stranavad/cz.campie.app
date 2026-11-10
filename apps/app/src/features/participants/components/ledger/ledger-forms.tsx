import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { AdjustmentForm } from '@/features/participants/components/ledger/adjustment-form';
import { PaymentForm } from '@/features/participants/components/ledger/payment-form';

interface LedgerFormsProps {
  organisationId: string;
  registrationId: string;
  // Whether an Invoice request names a company that may pay.
  hasCompany: boolean;
}

// Adds a payment, a Correcting payment or a Price adjustment; entries are never changed afterwards. One form
// is open at a time, under the two buttons that open it.
export function LedgerForms({ organisationId, registrationId, hasCompany }: LedgerFormsProps) {
  const { t } = useTranslation('participants');
  const [open, setOpen] = useState<'payment' | 'adjustment' | null>(null);
  const toggle = (form: 'payment' | 'adjustment') => setOpen(open === form ? null : form);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="flex-[1_1_10rem]"
          aria-expanded={open === 'payment'}
          onClick={() => toggle('payment')}
        >
          {t('detail.addPayment')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-[1_1_8rem]"
          aria-expanded={open === 'adjustment'}
          onClick={() => toggle('adjustment')}
        >
          {t('detail.addAdjustment')}
        </Button>
      </div>
      {open === 'payment' ? (
        <PaymentForm organisationId={organisationId} registrationId={registrationId} hasCompany={hasCompany} />
      ) : null}
      {open === 'adjustment' ? (
        <AdjustmentForm organisationId={organisationId} registrationId={registrationId} />
      ) : null}
    </div>
  );
}
