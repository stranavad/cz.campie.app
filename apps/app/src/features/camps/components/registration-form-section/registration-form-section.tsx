import { useTranslation } from 'react-i18next';

import { RegistrationFormBuilder } from '@/features/camps/components/registration-form-section/registration-form-builder';
import { useRegistrationFormSection } from '@/features/camps/components/registration-form-section/use-registration-form-section.hook';

interface RegistrationFormSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// The Camp's registration form: the builder over the draft, publishing and the preview.
export function RegistrationFormSection({ organisationId, campId, canWrite }: RegistrationFormSectionProps) {
  const { t } = useTranslation('camps');
  const form = useRegistrationFormSection(organisationId, campId);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('registrationForm.title')}</h2>
      {form.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {form.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {form.isSuccess ? (
        // Seeded once per Camp: a refetch, as after another admin's publish, never throws away edits.
        <RegistrationFormBuilder organisationId={organisationId} campId={campId} form={form.data} canWrite={canWrite} />
      ) : null}
    </section>
  );
}
