import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';
import { withForm } from '@/core/form';
import { campFormOptions } from '@/features/camps/components/camp-form/camp-form.schema';
import { CampPhotoField } from '@/features/camps/components/camp-form/camp-photo-field';

// The Camp's name, the address of its page, its own web, and how its card and page present it to guardians:
// a description and a photo. The photo is saved as soon as it is chosen, apart from the form.
export const CampDetailsCard = withForm({
  ...campFormOptions,
  // The address of the Organisation's pages, which the slug ends: tabor-jezero.campie.cz/.
  props: { canWrite: false, pagesAddress: '', organisationId: '', campId: '' },
  render: function CampDetailsCard({ form, canWrite, pagesAddress, organisationId, campId }) {
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
          <form.AppField name="description">
            {(field) => (
              <field.TextAreaField label={t('camp.description')} description={t('camp.descriptionHint')} rows={5} />
            )}
          </form.AppField>
        </fieldset>
        <CampPhotoField organisationId={organisationId} campId={campId} canWrite={canWrite} />
      </Card>
    );
  },
});
