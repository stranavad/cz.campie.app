import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

import { PaymentRow } from '@/components/payment-row';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InvoiceRequestFields } from '@/core/invoice-request';
import { useInvoiceRequestCard } from '@/features/portal/components/home/use-invoice-request-card.hook';

interface InvoiceRequestCardProps {
  registration: GuardianRegistration;
}

// Part of the price invoiced to a company: what the guardian asked for and whether the camp has invoiced it.
export function InvoiceRequestCard({ registration }: InvoiceRequestCardProps) {
  const { t } = useTranslation('portal', { keyPrefix: 'invoice' });
  const card = useInvoiceRequestCard(registration);
  const { invoiceRequest } = card;

  if (!card.isShown) {
    return null;
  }

  return (
    <Card className="gap-3">
      <h3 className="font-sans text-sm font-semibold tracking-normal text-muted-foreground">{t('title')}</h3>
      {card.isEditing ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void card.form.handleSubmit();
          }}
        >
          <InvoiceRequestFields form={card.form} />
          <div className="flex flex-wrap gap-2">
            <card.form.AppForm>
              <card.form.SubmitButton>{t('save')}</card.form.SubmitButton>
            </card.form.AppForm>
            <Button type="button" variant="outline" onClick={card.cancel}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : invoiceRequest === null ? (
        <p className="text-sm text-muted-foreground">{t('none')}</p>
      ) : (
        <div className="flex flex-col gap-1.5 text-sm">
          <PaymentRow
            label={t('company')}
            value={`${invoiceRequest.companyName}, ${t('ico', { ico: invoiceRequest.ico })}`}
          />
          <PaymentRow label={t('amount')} value={czk(invoiceRequest.amount)} />
          <PaymentRow
            label={t('state')}
            value={
              invoiceRequest.invoicedOn === null
                ? t('toInvoice')
                : invoiceRequest.invoiceNumber === null
                  ? t('invoiced', { date: czechDate(invoiceRequest.invoicedOn) })
                  : t('invoicedNumber', {
                      date: czechDate(invoiceRequest.invoicedOn),
                      number: invoiceRequest.invoiceNumber,
                    })
            }
          />
        </div>
      )}
      {card.isInvoiced ? <p className="text-[13px] text-muted-foreground">{t('locked')}</p> : null}
      {card.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`failure.${card.failure}`)}
        </Alert>
      )}
      {card.isEditing ? null : (
        <div className="flex flex-wrap gap-2">
          {card.canEdit ? (
            <Button type="button" variant="outline" onClick={card.edit}>
              {invoiceRequest === null ? t('add') : t('change')}
            </Button>
          ) : null}
          {card.canRemove ? (
            <Button type="button" variant="outline" disabled={card.isRemoving} onClick={card.remove}>
              {t('remove')}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
