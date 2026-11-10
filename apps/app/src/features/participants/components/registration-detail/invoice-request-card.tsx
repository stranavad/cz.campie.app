import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

import { FileButton } from '@/components/file-button';
import { PaymentRow } from '@/components/payment-row';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { InvoiceFileList, InvoiceRequestFields } from '@/core/invoice-request';
import { useInvoiceRequestCard } from '@/features/participants/components/registration-detail/use-invoice-request-card.hook';

interface InvoiceRequestCardProps {
  organisationId: string;
  detail: RegistrationDetail;
  canWrite: boolean;
}

// The company a part of the price is invoiced to, the camp's state of the invoice and the invoices uploaded.
export function InvoiceRequestCard({ organisationId, detail, canWrite }: InvoiceRequestCardProps) {
  const { t } = useTranslation('participants', { keyPrefix: 'detail.invoice' });
  const card = useInvoiceRequestCard(organisationId, detail);
  const { invoiceRequest, company } = card;

  if (invoiceRequest === null && !canWrite) {
    return null;
  }

  return (
    <Card className="gap-3">
      <CardTitle>{t('title')}</CardTitle>
      {card.editing === 'billing' ? (
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
      ) : card.editing === 'state' ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void card.stateForm.handleSubmit();
          }}
        >
          <div className="grid gap-3 min-[400px]:grid-cols-2">
            <card.stateForm.AppField name="invoicedOn">
              {(field) => <field.DateField label={t('invoicedOn')} description={t('invoicedOnHint')} clearable />}
            </card.stateForm.AppField>
            <card.stateForm.AppField name="invoiceNumber">
              {(field) => <field.TextField label={t('invoiceNumber')} />}
            </card.stateForm.AppField>
          </div>
          <div className="flex flex-wrap gap-2">
            <card.stateForm.AppForm>
              <card.stateForm.SubmitButton>{t('save')}</card.stateForm.SubmitButton>
            </card.stateForm.AppForm>
            <Button type="button" variant="outline" onClick={card.cancel}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : invoiceRequest === null ? (
        <p className="text-sm text-muted-foreground">{t('none')}</p>
      ) : (
        <div className="flex flex-col gap-1.5 text-sm">
          <PaymentRow label={t('company')} value={invoiceRequest.companyName} />
          <PaymentRow
            label={t('ids')}
            value={
              invoiceRequest.dic === null
                ? t('ico', { ico: invoiceRequest.ico })
                : t('icoDic', { ico: invoiceRequest.ico, dic: invoiceRequest.dic })
            }
          />
          <PaymentRow
            label={t('address')}
            value={`${invoiceRequest.street}, ${invoiceRequest.postcode} ${invoiceRequest.city}`}
          />
          {invoiceRequest.email === null ? null : <PaymentRow label={t('email')} value={invoiceRequest.email} />}
          {invoiceRequest.note === null ? null : <PaymentRow label={t('note')} value={invoiceRequest.note} />}
          <PaymentRow label={t('amount')} value={czk(invoiceRequest.amount)} strong />
          {company === null ? null : <PaymentRow label={t('companyLeft')} value={czk(company.balance)} />}
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
      <InvoiceFileList files={card.invoiceFiles} />
      {card.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`failure.${card.failure}`)}
        </Alert>
      )}
      {!canWrite || card.editing !== null ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={card.editBilling}>
            {invoiceRequest === null ? t('add') : t('change')}
          </Button>
          {invoiceRequest === null ? null : (
            <>
              <Button type="button" variant="outline" onClick={card.editState}>
                {invoiceRequest.invoicedOn === null ? t('markInvoiced') : t('changeState')}
              </Button>
              <FileButton label={t('upload')} accept="application/pdf" disabled={card.isBusy} onFile={card.upload} />
            </>
          )}
          {card.canRemove ? (
            <Button type="button" variant="outline" disabled={card.isBusy} onClick={card.remove}>
              {t('remove')}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
