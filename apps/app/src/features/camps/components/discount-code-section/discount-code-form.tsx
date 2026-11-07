import { useTranslation } from 'react-i18next';

import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';

import { useDiscountCodeForm } from '@/features/camps/components/discount-code-section/use-discount-code-form.hook';

interface DiscountCodeFormProps {
  organisationId: string;
  campId: string;
}

export function DiscountCodeForm({ organisationId, campId }: DiscountCodeFormProps) {
  const { t } = useTranslation('camps');
  const { form, hasFailed } = useDiscountCodeForm(organisationId, campId);

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-4 rounded-lg border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h3 className="font-medium">{t('discountCodes.create')}</h3>
      <form.AppField name="code">
        {(field) => <field.TextField label={t('discountCodes.code')} description={t('discountCodes.codeHint')} />}
      </form.AppField>
      <form.AppField name="kind">
        {(field) => (
          <field.SelectField
            label={t('discountCodes.kind')}
            options={DISCOUNT_CODE_KINDS.map((kind) => ({ value: kind, label: t(`discountCodes.kinds.${kind}`) }))}
          />
        )}
      </form.AppField>
      <form.AppField name="value">
        {(field) => <field.TextField label={t('discountCodes.value')} type="number" inputMode="numeric" />}
      </form.AppField>
      <form.AppField name="usageLimit">
        {(field) => (
          <field.TextField
            label={t('discountCodes.usageLimit')}
            description={t('discountCodes.optional')}
            type="number"
            inputMode="numeric"
          />
        )}
      </form.AppField>
      <form.AppField name="expiresOn">
        {(field) => (
          <field.TextField label={t('discountCodes.expiresOn')} description={t('discountCodes.optional')} type="date" />
        )}
      </form.AppField>
      {hasFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('discountCodes.submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
