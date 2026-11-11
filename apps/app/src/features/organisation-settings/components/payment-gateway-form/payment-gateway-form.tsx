import { CreditCardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconTile } from '@/components/icon-tile';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/features/organisation-settings/components/form-message';
import { PaymentGatewayRemovalDialog } from '@/features/organisation-settings/components/payment-gateway-form/payment-gateway-removal-dialog';
import { usePaymentGatewayForm } from '@/features/organisation-settings/components/payment-gateway-form/use-payment-gateway-form.hook';

// The Organisation's own Comgate account for card payments, inside the Platby section; without it, bank
// transfer only.
export function PaymentGatewayForm({ organisationId }: { organisationId: string }) {
  const { t } = useTranslation('organisationSettings');
  const gateway = usePaymentGatewayForm(organisationId);
  const isConfigured = gateway.merchantId !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-bold">{t('paymentGateway.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('paymentGateway.intro')}</p>
      </div>
      {gateway.isLoading ? null : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-3 pr-4">
          <IconTile tone={isConfigured ? 'success' : 'neutral'} className={isConfigured ? undefined : 'bg-card'}>
            <CreditCardIcon />
          </IconTile>
          <p className="min-w-0 flex-[1_1_12rem] text-sm font-semibold">
            {gateway.merchantId === null
              ? t('paymentGateway.none')
              : t('paymentGateway.configured', { merchantId: gateway.merchantId })}
          </p>
          {isConfigured ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-danger-foreground"
              disabled={gateway.isRemoving}
              onClick={() => gateway.setAskingRemoval(true)}
            >
              {t('paymentGateway.remove')}
            </Button>
          ) : null}
        </div>
      )}
      <PaymentGatewayRemovalDialog
        open={gateway.isAskingRemoval}
        onOpenChange={gateway.setAskingRemoval}
        isRemoving={gateway.isRemoving}
        onConfirm={gateway.removeKeys}
      />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void gateway.form.handleSubmit();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>
        {gateway.status === 'saved' ? <FormMessage tone="success">{t('paymentGateway.saved')}</FormMessage> : null}
        {gateway.status === 'removed' ? <FormMessage tone="success">{t('paymentGateway.removed')}</FormMessage> : null}
        {gateway.status === 'failed' ? <FormMessage tone="danger">{t('failure')}</FormMessage> : null}
        <gateway.form.AppForm>
          <gateway.form.SubmitButton className="self-start">
            {isConfigured ? t('paymentGateway.replace') : t('paymentGateway.save')}
          </gateway.form.SubmitButton>
        </gateway.form.AppForm>
      </form>
    </div>
  );
}
