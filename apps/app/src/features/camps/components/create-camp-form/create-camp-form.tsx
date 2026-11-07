import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useCreateCampForm } from '@/features/camps/components/create-camp-form/use-create-camp-form.hook';

interface CreateCampFormProps {
  organisationId: string;
}

export function CreateCampForm({ organisationId }: CreateCampFormProps) {
  const { t } = useTranslation('camps');
  const [isOpen, setOpen] = useState(false);
  const { form, hasFailed } = useCreateCampForm(organisationId, () => setOpen(false));

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        {t('create.open')}
      </Button>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('create.title')}</h2>
      <form
        noValidate
        className="flex max-w-xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="name">{(field) => <field.TextField label={t('camp.name')} />}</form.AppField>
        <form.AppField name="slug">
          {(field) => <field.TextField label={t('camp.slug')} description={t('camp.slugHint')} />}
        </form.AppField>
        <form.AppField name="contactEmail">
          {(field) => <field.TextField label={t('camp.contactEmail')} type="email" />}
        </form.AppField>
        {hasFailed ? (
          <p role="alert" className="text-sm text-destructive">
            {t('create.failure')}
          </p>
        ) : null}
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('create.submit')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </section>
  );
}
