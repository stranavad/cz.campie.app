import { useTranslation } from 'react-i18next';

import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';

import { Card, CardTitle } from '@/components/ui/card';
import { FieldLegend } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// What guardians may still change, and what siblings save.
export const CampGuardiansCard = withForm({
  ...campFormOptions,
  props: { canWrite: false },
  render: function CampGuardiansCard({ form, canWrite }) {
    const { t } = useTranslation('camps');

    return (
      <Card>
        <CardTitle>{t('camp.registrationTitle')}</CardTitle>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
          <form.AppField name="contactEditLockDate">
            {(field) => (
              <field.DateField
                label={t('camp.contactEditLockDate')}
                description={t('camp.contactEditLockDateHint')}
                clearable
                className="sm:max-w-56"
              />
            )}
          </form.AppField>
        </fieldset>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4 border-t border-border-subtle pt-4">
          <FieldLegend>{t('siblingDiscount.title')}</FieldLegend>
          <form.AppField name="siblingDiscountAmount">
            {(field) => (
              <field.TextField
                label={t('siblingDiscount.amount')}
                description={t('siblingDiscount.amountHint')}
                type="number"
                inputMode="numeric"
                className="sm:max-w-40"
              />
            )}
          </form.AppField>
          <form.AppField name="siblingDiscountAppliesTo">
            {(field) => (
              <field.SelectField
                label={t('siblingDiscount.appliesTo')}
                options={SIBLING_DISCOUNT_MODES.map((mode) => ({
                  value: mode,
                  label: t(`siblingDiscount.modes.${mode}`),
                }))}
              />
            )}
          </form.AppField>
        </fieldset>
      </Card>
    );
  },
});
