import { useTranslation } from 'react-i18next';

import type { Camp } from '@repo/schema/camps';

import { CampContactCard } from '@/features/camps/components/camp-form/camp-contact-card';
import { CampDetailsCard } from '@/features/camps/components/camp-form/camp-details-card';
import { CampGuardiansCard } from '@/features/camps/components/camp-form/camp-guardians-card';
import { CampModulesCard } from '@/features/camps/components/camp-form/camp-modules-card';
import { useCampForm } from '@/features/camps/components/camp-form/use-camp-form.hook';
import { SaveStatus } from '@/features/camps/components/save-status';

interface CampFormFieldsProps {
  organisationId: string;
  camp: Camp;
  canWrite: boolean;
}

// One form across the cards, saved whole: the Camp's identity and contact beside its modules and rules.
export function CampFormFields({ organisationId, camp, canWrite }: CampFormFieldsProps) {
  const { t } = useTranslation('camps');
  const { form, status } = useCampForm(organisationId, camp);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          <CampDetailsCard form={form} canWrite={canWrite} />
          <CampContactCard form={form} canWrite={canWrite} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <CampModulesCard form={form} canWrite={canWrite} />
          <CampGuardiansCard form={form} canWrite={canWrite} />
        </div>
      </div>
      {canWrite ? (
        <div className="flex flex-wrap items-center gap-3">
          <form.AppForm>
            <form.SubmitButton>{t('save')}</form.SubmitButton>
          </form.AppForm>
          <SaveStatus status={status} />
        </div>
      ) : null}
    </form>
  );
}
