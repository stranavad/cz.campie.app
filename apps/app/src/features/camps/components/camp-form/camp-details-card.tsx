import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';

// The Camp's name, the address of its page and its own web.
export const CampDetailsCard = withForm({
  ...campFormOptions,
  // The address of the Organisation's pages, which the slug ends: tabor-jezero.campie.cz/.
  props: { canWrite: false, pagesAddress: '' },
  render: function CampDetailsCard({ form, canWrite, pagesAddress }) {
    const { t } = useTranslation('camps');

    return (
      <Card>
        <CardTitle>{t('camp.title')}</CardTitle>
        <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-4">
          <form.AppField name="name">{(field) => <field.TextField label={t('camp.name')} />}</form.AppField>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <form.AppField name="slug">
              {(field) => (
                <field.TextField
                  label={t('camp.slug')}
                  description={t('camp.slugHint', { address: `${pagesAddress}${field.state.value}` })}
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </form.AppField>
            <form.AppField name="websiteUrl">
              {(field) => <field.TextField label={t('camp.websiteUrl')} type="url" />}
            </form.AppField>
          </div>
        </fieldset>
      </Card>
    );
  },
});
