import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { CampFormFields } from '@/features/camps/components/camp-form/camp-form-fields';
import { useCamp } from '@/features/camps/components/camp-form/use-camp.hook';

interface CampFormProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

export function CampForm({ organisationId, campId, canWrite }: CampFormProps) {
  const { t } = useTranslation('camps');
  const camp = useCamp(organisationId, campId);

  if (camp.isPending) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (camp.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return <CampFormFields organisationId={organisationId} camp={camp.data} canWrite={canWrite} />;
}
