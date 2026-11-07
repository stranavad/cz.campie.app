import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { usePaymentGatewayForm } from '@/features/organisation-settings/components/payment-gateway-form/use-payment-gateway-form.hook';

// The Organisation's own Comgate account for card payments; without it, bank transfer only.
export function PaymentGatewayForm({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('organisationSettings');
  const gateway = usePaymentGatewayForm(organisationId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('paymentGateway.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('paymentGateway.intro')}</p>
      {gateway.isLoading ? null : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {gateway.merchantId === null
            ? t('paymentGateway.none')
            : t('paymentGateway.configured', { merchantId: gateway.merchantId })}
          {gateway.merchantId === null ? null : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={gateway.isRemoving}
              onClick={gateway.removeKeys}
            >
              {t('paymentGateway.remove')}
            </Button>
          )}
        </div>
      )}
      <form
        noValidate
        className="flex max-w-xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void gateway.form.handleSubmit();
        }}
      >
        <gateway.form.AppField name="merchantId">
          {(field) => <field.TextField label={t('paymentGateway.merchantId')} inputMode="numeric" />}
        </gateway.form.AppField>
        <gateway.form.AppField name="secret">
          {(field) => (
            <field.TextField
              label={t('paymentGateway.secret')}
              description={t('paymentGateway.secretHint')}
              type="password"
              autoComplete="off"
            />
          )}
        </gateway.form.AppField>
        {gateway.status === 'saved' ? <output className="block text-sm">{t('paymentGateway.saved')}</output> : null}
        {gateway.status === 'removed' ? <output className="block text-sm">{t('paymentGateway.removed')}</output> : null}
        {gateway.status === 'failed' ? (
          <p role="alert" className="text-sm text-destructive">
            {t('failure')}
          </p>
        ) : null}
        <gateway.form.AppForm>
          <gateway.form.SubmitButton className="self-start">
            {gateway.merchantId === null ? t('paymentGateway.save') : t('paymentGateway.replace')}
          </gateway.form.SubmitButton>
        </gateway.form.AppForm>
      </form>
    </section>
  );
}
