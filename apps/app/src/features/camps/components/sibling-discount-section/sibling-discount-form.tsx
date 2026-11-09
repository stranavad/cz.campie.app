import { useTranslation } from 'react-i18next';

import type { Camp } from '@repo/schema/camps';
import { SIBLING_DISCOUNT_MODES } from '@repo/schema/pricing';

import { SettingSwitch } from '@/components/setting-switch';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { SaveStatus } from '@/features/camps/components/save-status';
import { useSiblingDiscountForm } from '@/features/camps/components/sibling-discount-section/use-sibling-discount-form.hook';

interface SiblingDiscountFormProps {
  organisationId: string;
  camp: Camp;
  canWrite: boolean;
}

// The Sibling discount, saved on its own: switched on, how much per child and which children get it.
export function SiblingDiscountForm({ organisationId, camp, canWrite }: SiblingDiscountFormProps) {
  const { t } = useTranslation('camps');
  const { form, status } = useSiblingDiscountForm(organisationId, camp);

  return (
    <Card>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex min-w-0 flex-[2_1_18rem] flex-col gap-1">
              <CardTitle>{t('siblingDiscount.title')}</CardTitle>
              <CardDescription>{t('siblingDiscount.intro')}</CardDescription>
            </div>
            <form.AppField name="enabled">
              {(field) => (
                <SettingSwitch
                  label={t('siblingDiscount.enabled')}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                  className="flex-none"
                />
              )}
            </form.AppField>
          </div>
          <form.Subscribe selector={(state) => state.values.enabled}>
            {(enabled) =>
              enabled ? (
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <form.AppField name="amount">
                    {(field) => (
                      <field.TextField label={t('siblingDiscount.amount')} type="number" inputMode="numeric" min={0} />
                    )}
                  </form.AppField>
                  <form.AppField name="appliesTo">
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
                </div>
              ) : null
            }
          </form.Subscribe>
        </fieldset>
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-3">
            <form.AppForm>
              <form.SubmitButton>{t('save')}</form.SubmitButton>
            </form.AppForm>
            <SaveStatus status={status} />
          </div>
        ) : null}
      </form>
    </Card>
  );
}
