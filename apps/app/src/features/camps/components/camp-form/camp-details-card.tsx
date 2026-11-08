import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// The Camp's name and addresses.
export const CampDetailsCard = withForm({
  ...campFormOptions,
  props: { canWrite: false },
  render: function CampDetailsCard({ form, canWrite }) {
    const { t } = useTranslation('camps');

    return (
      <Card>
        <CardTitle>{t('camp.title')}</CardTitle>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
          <form.AppField name="name">{(field) => <field.TextField label={t('camp.name')} />}</form.AppField>
          <form.AppField name="slug">
            {(field) => (
              <field.TextField
                label={t('camp.slug')}
                description={t('camp.slugHint')}
                autoCapitalize="none"
                spellCheck={false}
              />
            )}
          </form.AppField>
          <form.AppField name="websiteUrl">
            {(field) => <field.TextField label={t('camp.websiteUrl')} type="url" />}
          </form.AppField>
        </fieldset>
      </Card>
    );
  },
});
