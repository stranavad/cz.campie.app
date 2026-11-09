import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// Who guardians reach: shown to them, and the reply address of the Camp's e-mails.
export const CampContactCard = withForm({
  ...campFormOptions,
  props: { canWrite: false },
  render: function CampContactCard({ form, canWrite }) {
    const { t } = useTranslation('camps');

    return (
      <Card>
        <div className="flex flex-col gap-1">
          <CardTitle>{t('camp.contactTitle')}</CardTitle>
          <CardDescription>{t('camp.contactHint')}</CardDescription>
        </div>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
          <form.AppField name="contactName">
            {(field) => <field.TextField label={t('camp.contactName')} autoComplete="off" />}
          </form.AppField>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="contactEmail">
              {(field) => <field.TextField label={t('camp.contactEmail')} type="email" autoComplete="off" />}
            </form.AppField>
            <form.AppField name="contactPhone">
              {(field) => <field.TextField label={t('camp.contactPhone')} type="tel" autoComplete="off" />}
            </form.AppField>
          </div>
        </fieldset>
      </Card>
    );
  },
});
