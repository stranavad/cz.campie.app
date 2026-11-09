import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// Until when guardians may still change their details themselves.
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
      </Card>
    );
  },
});
