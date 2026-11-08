import { useTranslation } from 'react-i18next';

import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDiscountCodeForm } from '@/features/camps/components/discount-code-section/use-discount-code-form.hook';

interface DiscountCodeFormProps {
  organisationId: string;
  campId: string;
  onClose: () => void;
}

// A new code; the form stays open and empty after each one, for adding several in a row.
export function DiscountCodeForm({ organisationId, campId, onClose }: DiscountCodeFormProps) {
  const { t } = useTranslation('camps');
  const { form, hasFailed } = useDiscountCodeForm(organisationId, campId);

  return (
    <form
      noValidate
      className="flex flex-col gap-5 rounded-[20px] border border-border p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h3 className="text-lg font-bold">{t('discountCodes.create')}</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            <field.DateField label={t('discountCodes.expiresOn')} description={t('discountCodes.optional')} clearable />
          )}
        </form.AppField>
      </div>
      {hasFailed ? (
        <Alert variant="danger" role="alert">
          {t('failure')}
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t('discountCodes.close')}
        </Button>
        <form.AppForm>
          <form.SubmitButton>{t('discountCodes.submit')}</form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
