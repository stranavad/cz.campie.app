import { useTranslation } from 'react-i18next';

import { withForm } from '@/core/form';
import { invoiceRequestFormOptions } from '@/core/invoice-request/invoice-request-form.schema';

// The company's billing details and the amount to invoice, inside a form built from the Invoice request's
// options.
export const InvoiceRequestFields = withForm({
  ...invoiceRequestFormOptions,
  render: function InvoiceRequestFields({ form }) {
    const { t } = useTranslation('common', { keyPrefix: 'invoiceRequest' });

    return (
      <div className="flex flex-col gap-3">
        <form.AppField name="companyName">
          {(field) => <field.TextField label={t('companyName')} autoComplete="organization" />}
        </form.AppField>
        <div className="grid gap-3 min-[400px]:grid-cols-2">
          <form.AppField name="ico">
            {(field) => <field.TextField label={t('ico')} inputMode="numeric" />}
          </form.AppField>
          <form.AppField name="dic">{(field) => <field.TextField label={t('dic')} />}</form.AppField>
        </div>
        <form.AppField name="street">
          {(field) => <field.TextField label={t('street')} autoComplete="street-address" />}
        </form.AppField>
        <div className="grid gap-3 min-[400px]:grid-cols-[2fr_1fr]">
          <form.AppField name="city">
            {(field) => <field.TextField label={t('city')} autoComplete="address-level2" />}
          </form.AppField>
          <form.AppField name="postcode">
            {(field) => <field.TextField label={t('postcode')} inputMode="numeric" autoComplete="postal-code" />}
          </form.AppField>
        </div>
        <form.AppField name="email">
          {(field) => <field.TextField label={t('email')} type="email" autoComplete="email" />}
        </form.AppField>
        <form.AppField name="note">{(field) => <field.TextField label={t('note')} />}</form.AppField>
        <form.AppField name="amount">
          {(field) => <field.TextField label={t('amount')} description={t('amountHint')} inputMode="numeric" />}
        </form.AppField>
      </div>
    );
  },
});
