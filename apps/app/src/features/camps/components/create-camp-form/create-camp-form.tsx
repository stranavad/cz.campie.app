import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateCampForm } from '@/features/camps/components/create-camp-form/use-create-camp-form.hook';

interface CreateCampFormProps {
  organisationId: string;
  onClose: () => void;
}

export function CreateCampForm({ organisationId, onClose }: CreateCampFormProps) {
  const { t } = useTranslation('camps');
  const { form, hasFailed } = useCreateCampForm(organisationId, onClose);

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle>{t('create.title')}</CardTitle>
          <CardDescription>{t('create.intro')}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" aria-label={t('create.close')} onClick={onClose}>
          <XIcon aria-hidden="true" />
        </Button>
      </CardHeader>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <form.AppField name="name">{(field) => <field.TextField label={t('camp.name')} />}</form.AppField>
          <form.AppField name="contactEmail">
            {(field) => <field.TextField label={t('camp.contactEmail')} type="email" />}
          </form.AppField>
          <div className="md:col-span-2">
            <form.AppField name="slug">
              {(field) => <field.TextField label={t('camp.slug')} description={t('camp.slugHint')} />}
            </form.AppField>
          </div>
        </div>
        {hasFailed ? (
          <Alert variant="danger" role="alert">
            {t('create.failure')}
          </Alert>
        ) : null}
        <CardFooter>
          <form.AppForm>
            <form.SubmitButton>{t('create.submit')}</form.SubmitButton>
          </form.AppForm>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('turnus.cancel')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
