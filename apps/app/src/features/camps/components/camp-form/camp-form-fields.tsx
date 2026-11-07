import { useTranslation } from 'react-i18next';

import { CAMP_MODULES, type Camp } from '@repo/schema/camps';

import { useCampForm } from '@/features/camps/components/camp-form/use-camp-form.hook';

interface CampFormFieldsProps {
  organisationId: string;
  camp: Camp;
  canWrite: boolean;
}

export function CampFormFields({ organisationId, camp, canWrite }: CampFormFieldsProps) {
  const { t } = useTranslation('camps');
  const { form, status } = useCampForm(organisationId, camp);

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={!canWrite} className="flex flex-col gap-5">
        <legend className="mb-3 text-lg font-semibold">{t('camp.title')}</legend>
        <form.AppField name="name">{(field) => <field.TextField label={t('camp.name')} />}</form.AppField>
        <form.AppField name="slug">
          {(field) => <field.TextField label={t('camp.slug')} description={t('camp.slugHint')} />}
        </form.AppField>
        <form.AppField name="websiteUrl">
          {(field) => <field.TextField label={t('camp.websiteUrl')} type="url" />}
        </form.AppField>
        <form.AppField name="contactName">
          {(field) => <field.TextField label={t('camp.contactName')} description={t('camp.contactHint')} />}
        </form.AppField>
        <form.AppField name="contactEmail">
          {(field) => <field.TextField label={t('camp.contactEmail')} type="email" />}
        </form.AppField>
        <form.AppField name="contactPhone">
          {(field) => <field.TextField label={t('camp.contactPhone')} type="tel" />}
        </form.AppField>
      </fieldset>
      <fieldset disabled={!canWrite} className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-semibold">{t('modules.title')}</legend>
        <p className="text-sm text-muted-foreground">{t('modules.intro')}</p>
        {CAMP_MODULES.map((module) => (
          <form.AppField key={module} name={`modules.${module}`}>
            {(field) => <field.CheckboxField label={t(`modules.${module}`)} />}
          </form.AppField>
        ))}
      </fieldset>
      {status === 'saved' ? <output className="block text-sm">{t('saved')}</output> : null}
      {status === 'failed' ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      {canWrite ? (
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
        </form.AppForm>
      ) : null}
    </form>
  );
}
