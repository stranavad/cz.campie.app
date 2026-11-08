import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LedgerForms } from '@/features/participants/components/ledger/ledger-forms';
import { PaymentLines } from '@/features/participants/components/registration-detail/payment-lines';
import { PriceLines } from '@/features/participants/components/registration-detail/price-lines';

interface PaymentsCardProps {
  organisationId: string;
  registrationId: string;
  detail: RegistrationDetail;
  canWrite: boolean;
}

// The Registration's money: what is left to pay, the price and the payments, and new ledger entries.
export function PaymentsCard({ organisationId, registrationId, detail, canWrite }: PaymentsCardProps) {
  const { t } = useTranslation('participants');
  const { ledger } = detail;

  return (
    <Card>
      <CardTitle>{t('detail.payments')}</CardTitle>
      <div className="flex flex-col gap-1">
        <span className="font-display text-4xl leading-none font-bold tracking-tight tabular-nums">
          {czk(ledger.balance)}
        </span>
        <span className="text-sm text-muted-foreground">{t('detail.balanceOf', { total: czk(ledger.total) })}</span>
      </div>
      <Progress value={ledger.total === 0 ? 1 : ledger.paid / ledger.total} label={t('detail.paidShare')} />
      {ledger.overdue ? (
        <Alert variant="danger">
          <CircleAlertIcon aria-hidden="true" />
          {t('detail.overdue')}
        </Alert>
      ) : null}
      <PriceLines detail={detail} />
      <PaymentLines ledger={ledger} />
      {canWrite ? <LedgerForms organisationId={organisationId} registrationId={registrationId} /> : null}
    </Card>
  );
}
