import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
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

  if (form.isPending) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (form.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  // Seeded once per Camp: a refetch, as after another admin's publish, never throws away edits.
  return (
    <RegistrationFormBuilder organisationId={organisationId} campId={campId} form={form.data} canWrite={canWrite} />
  );
}
